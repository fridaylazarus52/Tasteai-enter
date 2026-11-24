"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Boxes,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  FileBarChart,
  ImagePlus,
  LoaderCircle,
  PackageSearch,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Users,
} from "lucide-react";
import {
  getOrCreateBusiness,
  money,
  dateLabel,
  type TasteBusiness,
} from "@/lib/business-client";

type Row = Record<string, string | number | boolean | null | undefined>;
type Product = Row & {
  id: string;
  name: string;
  category: string | null;
  sku: string | null;
  unit_price: number | string;
  cost_price: number | string;
  stock_quantity: number | string;
  is_active: boolean;
};
type Customer = Row & {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};
type Sale = Row & {
  id: string;
  sale_number: string | null;
  status: string;
  total_amount: number | string;
  sold_at: string;
  customer_id: string | null;
  notes: string | null;
};
type Expense = Row & {
  id: string;
  category: string;
  description: string | null;
  amount: number | string;
  spent_at: string;
};
type SavedInsight = Row & {
  id: string;
  insight_type: string;
  title: string;
  summary: string;
  status: string;
  created_at: string;
};

const moduleInfo: Record<
  string,
  {
    title: string;
    eyebrow: string;
    description: string;
    icon: typeof BrainCircuit;
  }
> = {
  insights: {
    title: "AI Insights",
    eyebrow: "AI BUSINESS ANALYST",
    description:
      "Turn your saved sales, menu and stock records into practical business signals and actions.",
    icon: BrainCircuit,
  },
  sales: {
    title: "Sales & Revenue",
    eyebrow: "FINANCIAL PERFORMANCE",
    description:
      "Record transactions and review revenue from your completed sales.",
    icon: BarChart3,
  },
  orders: {
    title: "Orders",
    eyebrow: "ORDER OPERATIONS",
    description:
      "Track transaction status and follow orders through your workflow.",
    icon: ClipboardList,
  },
  customers: {
    title: "Customers",
    eyebrow: "CUSTOMER INTELLIGENCE",
    description:
      "Create and maintain customer records for your business.",
    icon: Users,
  },
  menu: {
    title: "Menu Intelligence",
    eyebrow: "PRODUCT PERFORMANCE",
    description:
      "Manage products, categories, selling prices and product costs.",
    icon: PackageSearch,
  },
  inventory: {
    title: "Inventory",
    eyebrow: "STOCK & OPERATIONS",
    description:
      "Review stock quantities and update inventory as deliveries or counts change.",
    icon: Boxes,
  },
  forecasting: {
    title: "Forecasting",
    eyebrow: "PLAN AHEAD",
    description:
      "Estimate near-term revenue from your recent completed sales history.",
    icon: Activity,
  },
  reports: {
    title: "Reports",
    eyebrow: "BUSINESS REPORTING",
    description:
      "Review sales and expenses, then export records for your own reporting.",
    icon: FileBarChart,
  },
  settings: {
    title: "Settings",
    eyebrow: "WORKSPACE PREFERENCES",
    description:
      "Manage the business profile and default currency used in the workspace.",
    icon: Sparkles,
  },
};

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="workspace-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="workspace-empty">
      <PackageSearch size={25} />
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

export default function ModuleWorkspace({
  section,
}: {
  section: string;
}) {
  const info = moduleInfo[section];

  const [business, setBusiness] = useState<TasteBusiness | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "Main course",
    unit_price: "",
    cost_price: "",
    stock_quantity: "",
  });

  const [customerForm, setCustomerForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [saleForm, setSaleForm] = useState({
    product_id: "",
    customer_id: "",
    quantity: "1",
    discount_amount: "0",
    tax_amount: "0",
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    category: "Supplies",
    description: "",
    amount: "",
    spent_at: new Date().toISOString().slice(0, 10),
  });

  const [settingsForm, setSettingsForm] = useState({
    name: "",
    business_type: "restaurant",
    currency: "NGN",
    timezone: "Africa/Lagos",
  });

  const [marketplaceRestaurantId, setMarketplaceRestaurantId] =
    useState<string | null>(null);
  const [restaurantImageUrl, setRestaurantImageUrl] = useState("");
  const [restaurantPhotoFile, setRestaurantPhotoFile] =
    useState<File | null>(null);
  const [uploadingRestaurantPhoto, setUploadingRestaurantPhoto] =
    useState(false);

  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { business: workspace, supabase } =
        await getOrCreateBusiness();

      setBusiness(workspace);

      setSettingsForm({
        name: workspace.name,
        business_type: workspace.business_type,
        currency: workspace.currency,
        timezone: workspace.timezone,
      });

      // Load this business's marketplace listing and saved restaurant photo.
      const {
        data: marketplaceRestaurant,
        error: marketplaceRestaurantError,
      } = await supabase
        .from("marketplace_restaurants")
        .select("id, image_url")
        .eq("business_id", workspace.id)
        .limit(1)
        .maybeSingle();

      if (marketplaceRestaurantError) {
        console.error(
          "Could not load marketplace restaurant profile:",
          marketplaceRestaurantError.message
        );

        setMarketplaceRestaurantId(null);
        setRestaurantImageUrl("");
      } else {
        setMarketplaceRestaurantId(
          marketplaceRestaurant?.id
            ? String(marketplaceRestaurant.id)
            : null
        );

        setRestaurantImageUrl(
          marketplaceRestaurant?.image_url || ""
        );
      }

      const [p, c, s, e, i] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id,name,sku,category,description,unit_price,cost_price,stock_quantity,is_active,created_at"
          )
          .eq("business_id", workspace.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("customers")
          .select("id,full_name,email,phone,notes,created_at")
          .eq("business_id", workspace.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("sales")
          .select(
            "id,sale_number,status,total_amount,sold_at,customer_id,notes,currency"
          )
          .eq("business_id", workspace.id)
          .order("sold_at", { ascending: false })
          .limit(500),

        supabase
          .from("expenses")
          .select("id,category,description,amount,spent_at,created_at")
          .eq("business_id", workspace.id)
          .order("spent_at", { ascending: false })
          .limit(500),

        supabase
          .from("ai_insights")
          .select("id,insight_type,title,summary,status,created_at")
          .eq("business_id", workspace.id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      const failure =
        p.error || c.error || s.error || e.error || i.error;

      if (failure) throw new Error(failure.message);

      setProducts((p.data ?? []) as Product[]);
      setCustomers((c.data ?? []) as Customer[]);
      setSales((s.data ?? []) as Sale[]);
      setExpenses((e.data ?? []) as Expense[]);
      setSavedInsights((i.data ?? []) as SavedInsight[]);

      setStockEdits(
        Object.fromEntries(
          (p.data ?? []).map((product: Product) => [
            product.id,
            String(product.stock_quantity ?? 0),
          ])
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load this workspace module."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const completedSales = useMemo(
    () => sales.filter((s) => s.status === "completed"),
    [sales]
  );

  const revenue = completedSales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );

  const currency = business?.currency || "NGN";

  const selectedProduct = products.find(
    (product) => product.id === saleForm.product_id
  );

  const saleEstimate = selectedProduct
    ? Number(selectedProduct.unit_price) *
        Math.max(0, Number(saleForm.quantity || 0)) -
      Math.max(0, Number(saleForm.discount_amount || 0)) +
      Math.max(0, Number(saleForm.tax_amount || 0))
    : 0;

  async function finish(message: string) {
    setNotice(message);
    await load();
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      const price = Number(productForm.unit_price);
      const cost = Number(productForm.cost_price);
      const stock = Number(productForm.stock_quantity);

      if (
        !productForm.name.trim() ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(cost) ||
        cost < 0 ||
        !Number.isFinite(stock) ||
        stock < 0
      ) {
        throw new Error(
          "Enter a product name and valid non-negative price, cost and stock values."
        );
      }

      const { error: insertError } = await supabase
        .from("products")
        .insert({
          business_id: business.id,
          name: productForm.name.trim(),
          sku: productForm.sku.trim() || null,
          category: productForm.category.trim() || null,
          unit_price: price,
          cost_price: cost,
          stock_quantity: stock,
        });

      if (insertError) throw insertError;

      setProductForm({
        name: "",
        sku: "",
        category: "Main course",
        unit_price: "",
        cost_price: "",
        stock_quantity: "",
      });

      await finish("Product saved to Supabase.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStock(product: Product) {
    const nextStock = Number(stockEdits[product.id]);

    if (!Number.isFinite(nextStock) || nextStock < 0) {
      setError("Stock must be zero or a positive number.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock_quantity: nextStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id)
        .eq("business_id", business?.id);

      if (updateError) throw updateError;

      await finish(`Stock updated for ${product.name}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update stock."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product: Product) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      const { error: updateError } = await supabase
        .from("products")
        .update({
          is_active: !product.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id)
        .eq("business_id", business?.id);

      if (updateError) throw updateError;

      await finish(
        product.is_active
          ? "Product archived from the active menu."
          : "Product restored to the active menu."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      if (!customerForm.full_name.trim()) {
        throw new Error("Enter the customer's name.");
      }

      const { error: insertError } = await supabase
        .from("customers")
        .insert({
          business_id: business.id,
          full_name: customerForm.full_name.trim(),
          email: customerForm.email.trim() || null,
          phone: customerForm.phone.trim() || null,
          notes: customerForm.notes.trim() || null,
        });

      if (insertError) throw insertError;

      setCustomerForm({
        full_name: "",
        email: "",
        phone: "",
        notes: "",
      });

      await finish("Customer saved to Supabase.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save customer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(customer: Customer) {
    if (
      !window.confirm(
        `Delete customer record for ${customer.full_name}? Past sales will remain, but the customer link may be cleared.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      const { error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id)
        .eq("business_id", business?.id);

      if (deleteError) throw deleteError;

      await finish("Customer deleted.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete customer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business || !selectedProduct) {
      setError("Choose a product for this sale.");
      return;
    }

    const quantity = Number(saleForm.quantity);
    const discount = Number(saleForm.discount_amount || 0);
    const tax = Number(saleForm.tax_amount || 0);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(discount) ||
      discount < 0 ||
      !Number.isFinite(tax) ||
      tax < 0
    ) {
      setError("Enter a valid quantity, discount and tax.");
      return;
    }

    const subtotal = Number(selectedProduct.unit_price) * quantity;

    if (discount > subtotal) {
      setError("Discount cannot be greater than the subtotal.");
      return;
    }

    if (quantity > Number(selectedProduct.stock_quantity)) {
      setError(
        `Insufficient recorded stock for ${selectedProduct.name}. Update inventory before recording this sale.`
      );
      return;
    }

    const total = subtotal - discount + tax;

    setSaving(true);
    setError("");
    setNotice("");

    let createdSaleId = "";

    try {
      const { supabase } = await getOrCreateBusiness();

      const {
        data: sale,
        error: saleError,
      } = await supabase
        .from("sales")
        .insert({
          business_id: business.id,
          customer_id: saleForm.customer_id || null,
          sale_number: `TA-${Date.now()}`,
          status: "completed",
          subtotal,
          tax_amount: tax,
          discount_amount: discount,
          total_amount: total,
          currency,
          notes: saleForm.notes.trim() || null,
          created_by:
            (await supabase.auth.getUser()).data.user?.id ?? null,
        })
        .select("id")
        .single();

      if (saleError || !sale) {
        throw saleError ?? new Error("Sale could not be created.");
      }

      createdSaleId = sale.id;

      const { error: itemError } = await supabase
        .from("sale_items")
        .insert({
          sale_id: sale.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity,
          unit_price: Number(selectedProduct.unit_price),
          line_total: subtotal,
        });

      if (itemError) {
        await supabase
          .from("sales")
          .delete()
          .eq("id", sale.id)
          .eq("business_id", business.id);

        throw itemError;
      }

      const newStock = Math.max(
        0,
        Number(selectedProduct.stock_quantity) - quantity
      );

      const { error: stockError } = await supabase
        .from("products")
        .update({
          stock_quantity: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProduct.id)
        .eq("business_id", business.id);

      setSaleForm({
        product_id: "",
        customer_id: "",
        quantity: "1",
        discount_amount: "0",
        tax_amount: "0",
        notes: "",
      });

      await finish(
        stockError
          ? "Sale saved. Stock could not be updated; please review inventory."
          : `Sale saved for ${money(total, currency)}.`
      );
    } catch (err) {
      if (createdSaleId) {
        setError(
          `The sale may have been saved. Please refresh before retrying. ${
            err instanceof Error ? err.message : ""
          }`
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Could not record sale."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function updateSaleStatus(sale: Sale, status: string) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      if (
        sale.status !== status &&
        sale.status === "completed" &&
        (status === "cancelled" || status === "refunded")
      ) {
        const {
          data: items,
          error: itemsError,
        } = await supabase
          .from("sale_items")
          .select("product_id,quantity")
          .eq("sale_id", sale.id);

        if (itemsError) throw itemsError;

        for (const item of items ?? []) {
          if (!item.product_id) continue;

          const product = products.find(
            (row) => row.id === item.product_id
          );

          if (!product) continue;

          const { error: stockError } = await supabase
            .from("products")
            .update({
              stock_quantity:
                Number(product.stock_quantity) + Number(item.quantity),
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id)
            .eq("business_id", business?.id);

          if (stockError) {
            throw new Error(
              `Status was not changed because stock could not be restored for ${product.name}: ${stockError.message}`
            );
          }
        }
      }

      if (sale.status !== "completed" && status === "completed") {
        const {
          data: items,
          error: itemsError,
        } = await supabase
          .from("sale_items")
          .select("product_id,quantity")
          .eq("sale_id", sale.id);

        if (itemsError) throw itemsError;

        for (const item of items ?? []) {
          if (!item.product_id) continue;

          const product = products.find(
            (row) => row.id === item.product_id
          );

          if (
            !product ||
            Number(item.quantity) > Number(product.stock_quantity)
          ) {
            throw new Error(
              `Insufficient stock to mark this sale completed for ${
                product?.name ?? "a linked product"
              }.`
            );
          }

          const { error: stockError } = await supabase
            .from("products")
            .update({
              stock_quantity:
                Number(product.stock_quantity) - Number(item.quantity),
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id)
            .eq("business_id", business?.id);

          if (stockError) throw stockError;
        }
      }

      const { error: updateError } = await supabase
        .from("sales")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sale.id)
        .eq("business_id", business?.id);

      if (updateError) throw updateError;

      await finish(
        `Order ${sale.sale_number || sale.id.slice(0, 8)} updated to ${status}.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update order."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) return;

    const amount = Number(expenseForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Expense amount must be greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      const { data: auth } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from("expenses")
        .insert({
          business_id: business.id,
          category: expenseForm.category,
          description: expenseForm.description.trim() || null,
          amount,
          spent_at: expenseForm.spent_at,
          currency,
          created_by: auth.user?.id ?? null,
        });

      if (insertError) throw insertError;

      setExpenseForm({
        category: "Supplies",
        description: "",
        amount: "",
        spent_at: new Date().toISOString().slice(0, 10),
      });

      await finish("Expense saved to Supabase.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save expense."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business || !settingsForm.name.trim()) {
      setError("Business name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          name: settingsForm.name.trim(),
          business_type: settingsForm.business_type,
          currency: settingsForm.currency,
          timezone: settingsForm.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", business.id)
        .eq("owner_id", business.owner_id);

      if (updateError) throw updateError;

      await finish("Workspace settings saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  // Validate the selected restaurant photo before upload.
  function selectRestaurantPhoto(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setRestaurantPhotoFile(null);
      setError("Choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setRestaurantPhotoFile(null);
      setError("Your restaurant photo must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setRestaurantPhotoFile(file);
    setError("");
    setNotice("");
  }

  // Upload the restaurant photo to Supabase Storage.
  async function uploadRestaurantPhoto() {
    if (!restaurantPhotoFile) {
      setError("Please select a restaurant photo first.");
      return;
    }

    setUploadingRestaurantPhoto(true);
    setError("");
    setNotice("");

    let uploadedPath = "";

    try {
      const { business: workspace, supabase } =
        await getOrCreateBusiness();

      // Confirm that the signed-in user owns this workspace.
      const {
        data: auth,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!auth.user || auth.user.id !== workspace.owner_id) {
        throw new Error(
          "You are not authorized to update this restaurant photo."
        );
      }

      // Retrieve the existing listing and its current photo.
      const {
        data: listing,
        error: listingError,
      } = await supabase
        .from("marketplace_restaurants")
        .select("id, image_url")
        .eq("business_id", workspace.id)
        .limit(1)
        .maybeSingle();

      if (listingError) throw listingError;

      if (!listing) {
        throw new Error(
          "Your business does not have a marketplace restaurant listing yet. Publish a restaurant listing before uploading its photo."
        );
      }

      const safeName = restaurantPhotoFile.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-");

      // Store each upload under the authenticated owner's business folder.
      uploadedPath = `restaurants/${workspace.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("marketplace-media")
        .upload(uploadedPath, restaurantPhotoFile, {
          cacheControl: "3600",
          contentType: restaurantPhotoFile.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicImage } = supabase.storage
        .from("marketplace-media")
        .getPublicUrl(uploadedPath);

      if (!publicImage.publicUrl) {
        throw new Error(
          "Supabase did not return a public image URL."
        );
      }

      // Save the new photo URL to the marketplace listing.
      const {
        data: updatedListing,
        error: updateError,
      } = await supabase
        .from("marketplace_restaurants")
        .update({
          image_url: publicImage.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id)
        .eq("business_id", workspace.id)
        .select("id")
        .single();

      if (updateError || !updatedListing) {
        // Remove the new upload if its database update failed.
        const { error: cleanupError } = await supabase.storage
          .from("marketplace-media")
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error(
            "Could not clean up failed restaurant photo upload:",
            cleanupError
          );
        }

        throw (
          updateError ||
          new Error(
            "The restaurant photo could not be linked to your listing."
          )
        );
      }

      // Update the UI immediately.
      setMarketplaceRestaurantId(String(updatedListing.id));
      setRestaurantImageUrl(publicImage.publicUrl);
      setRestaurantPhotoFile(null);

      // Delete the previous photo only after the new URL has been saved.
      // Only delete files belonging to this business in our own bucket.
      if (listing.image_url) {
        const storagePrefix =
          "/storage/v1/object/public/marketplace-media/";

        try {
          const previousUrl = new URL(listing.image_url);

          if (previousUrl.pathname.includes(storagePrefix)) {
            const encodedPath =
              previousUrl.pathname.split(storagePrefix)[1];

            const previousPath = decodeURIComponent(
              encodedPath || ""
            );

            if (
              previousPath.startsWith(
                `restaurants/${workspace.id}/`
              ) &&
              previousPath !== uploadedPath
            ) {
              const { error: removeError } =
                await supabase.storage
                  .from("marketplace-media")
                  .remove([previousPath]);

              if (removeError) {
                console.warn(
                  "New photo saved, but the previous photo could not be deleted:",
                  removeError.message
                );
              }
            }
          }
        } catch (cleanupError) {
          console.warn(
            "New photo saved, but the previous photo could not be processed for deletion:",
            cleanupError
          );
        }
      }

      setNotice(
        "Restaurant photo uploaded and saved successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not upload your restaurant photo."
      );
    } finally {
      setUploadingRestaurantPhoto(false);
    }
  }

  async function generateInsights() {
    if (!business) return;

    setGenerating(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      // Use the optional server-side LLM integration when configured.
      // The API key never reaches the browser.
      const aiResponse = await fetch("/api/ai/insights", {
        method: "POST",
      });

      const aiPayload = (await aiResponse
        .json()
        .catch(() => ({}))) as {
        configured?: boolean;
        insights?: {
          insight_type: string;
          title: string;
          summary: string;
          details?: Record<string, unknown>;
          confidence?: number;
        }[];
        error?: string;
      };

      if (
        aiResponse.ok &&
        aiPayload.configured &&
        Array.isArray(aiPayload.insights) &&
        aiPayload.insights.length
      ) {
        const { error: aiInsertError } = await supabase
          .from("ai_insights")
          .insert(
            aiPayload.insights.map((item) => ({
              business_id: business.id,
              insight_type: item.insight_type,
              title: item.title,
              summary: item.summary,
              details: item.details ?? {},
              confidence: item.confidence ?? 0.7,
              status: "new",
            }))
          );

        if (aiInsertError) throw aiInsertError;

        await finish(
          "AI-generated insights were saved from your authorized business records."
        );

        return;
      }

      if (!aiResponse.ok && aiResponse.status !== 503) {
        throw new Error(
          aiPayload.error || "AI insight generation failed."
        );
      }

      const fresh: {
        insight_type: string;
        title: string;
        summary: string;
        details: Record<string, string | number>;
        confidence: number;
      }[] = [];

      const low = products.filter(
        (product) =>
          product.is_active &&
          Number(product.stock_quantity) <= 5
      );

      if (low.length) {
        fresh.push({
          insight_type: "inventory",
          title: `${low.length} low-stock item${low.length === 1 ? "" : "s"}`,
          summary: `${low
            .slice(0, 5)
            .map((p) => p.name)
            .join(
              ", "
            )} have five or fewer units recorded. Review demand and supplier lead times before restocking.`,
          details: {
            item_count: low.length,
            source: "products.stock_quantity",
          },
          confidence: 0.95,
        });
      }

      const active = products.filter(
        (product) => product.is_active
      );

      const marginItems = active
        .filter((product) => Number(product.unit_price) > 0)
        .map((product) => ({
          name: product.name,
          margin:
            (Number(product.unit_price) -
              Number(product.cost_price)) /
            Number(product.unit_price),
        }));

      const weak = marginItems.filter(
        (item) => item.margin < 0.2
      );

      if (weak.length) {
        fresh.push({
          insight_type: "recommendation",
          title: "Review low-margin menu items",
          summary: `${weak
            .slice(0, 4)
            .map((item) => item.name)
            .join(
              ", "
            )} have a recorded gross margin below 20%. Verify ingredient costs, portion sizes and pricing before changing the menu.`,
          details: {
            item_count: weak.length,
            margin_threshold: 0.2,
          },
          confidence: 0.85,
        });
      }

      const recentCutoff = Date.now() - 30 * 86400000;

      const recentSales = completedSales.filter(
        (sale) =>
          new Date(sale.sold_at).getTime() >= recentCutoff
      );

      if (recentSales.length) {
        fresh.push({
          insight_type: "sales",
          title: "Recent sales snapshot",
          summary: `${
            recentSales.length
          } completed sales totalling ${money(
            recentSales.reduce(
              (sum, sale) =>
                sum + Number(sale.total_amount || 0),
              0
            ),
            currency
          )} were recorded in the last 30 days. Keep recording each transaction to improve trend analysis.`,
          details: {
            completed_sales: recentSales.length,
            days: 30,
          },
          confidence: 0.99,
        });
      }

      if (!customers.length) {
        fresh.push({
          insight_type: "customer",
          title: "Start building customer history",
          summary:
            "No customer records are saved yet. Add customers and associate them with sales to support repeat-purchase analysis later.",
          details: {
            customer_count: 0,
          },
          confidence: 0.99,
        });
      }

      if (!fresh.length) {
        fresh.push({
          insight_type: "general",
          title: "Add more business data",
          summary:
            "No immediate stock or margin warning was detected from the saved records. Keep products, sales and expenses up to date; the current checks are simple rules, not a predictive AI model.",
          details: {
            product_count: products.length,
            sales_count: sales.length,
          },
          confidence: 0.8,
        });
      }

      const { error: insertError } = await supabase
        .from("ai_insights")
        .insert(
          fresh.map((item) => ({
            business_id: business.id,
            ...item,
            status: "new",
          }))
        );

      if (insertError) throw insertError;

      await finish(
        "Business signals generated and saved. These are rule-based checks, not an external LLM response."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate insights."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function setInsightStatus(
    insight: SavedInsight,
    status: string
  ) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { supabase } = await getOrCreateBusiness();

      const { error: updateError } = await supabase
        .from("ai_insights")
        .update({ status })
        .eq("id", insight.id)
        .eq("business_id", business?.id);

      if (updateError) throw updateError;

      await finish(`Insight marked ${status}.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update insight."
      );
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const rows =
      section === "reports"
        ? sales.map((s) => ({
            sale_number: s.sale_number || s.id,
            date: s.sold_at,
            status: s.status,
            total_amount: s.total_amount,
            currency,
          }))
        : sales.map((s) => ({
            sale_number: s.sale_number || s.id,
            date: s.sold_at,
            status: s.status,
            total_amount: s.total_amount,
            currency,
          }));

    const header = [
      "sale_number",
      "date",
      "status",
      "total_amount",
      "currency",
    ];

    const csv = [
      header.join(","),
      ...rows.map((row) =>
        header
          .map(
            (key) =>
              `"${String(
                row[key as keyof typeof row] ?? ""
              ).replaceAll('"', '""')}"`
          )
          .join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `tasteai-sales-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    a.click();
    URL.revokeObjectURL(url);
  }

  if (!info) {
    return (
      <div className="workspace-empty">
        <h1>Module not found</h1>
        <p>This workspace section does not exist.</p>
        <Link href="/dashboard">Return to overview</Link>
      </div>
    );
  }

  const Icon = info.icon;
  const salesForTable =
    section === "orders" ? sales : sales.slice(0, 10);
  const recentExpenses = expenses.slice(0, 8);

  const daily = new Map<string, number>();

  completedSales.forEach((sale) => {
    const day = new Date(sale.sold_at)
      .toISOString()
      .slice(0, 10);

    daily.set(
      day,
      (daily.get(day) || 0) +
        Number(sale.total_amount || 0)
    );
  });

  const dailyEntries = [...daily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14);

  const averageDaily = dailyEntries.length
    ? dailyEntries.reduce(
        (sum, [, amount]) => sum + amount,
        0
      ) / dailyEntries.length
    : 0;

  return (
    <div className="module-page live-module-page">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">{info.eyebrow}</div>
          <h1>{info.title}</h1>
          <p>{info.description}</p>
        </div>

        <button
          className="button button-outline button-sm"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="workspace-status">
        <span className="live-status-dot" />
        {loading
          ? "Loading records…"
          : `Connected · ${business?.name ?? "Workspace"}`}
        <span className="workspace-status-spacer" />
        {business ? `Currency: ${business.currency}` : ""}
      </div>

      {error && (
        <div className="live-alert live-alert-error">
          <CircleAlert size={17} />
          <div>
            <strong>Action needs attention</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {notice && (
        <div className="live-alert live-alert-success">
          <CheckCircle2 size={17} />
          <div>{notice}</div>
        </div>
      )}

      {(section === "menu" || section === "inventory") && (
        <>
          {section === "menu" && (
            <section className="panel workspace-panel">
              <div className="workspace-panel-heading">
                <div>
                  <h2>
                    <Plus size={17} /> Add a product
                  </h2>
                  <p>
                    Prices and stock are saved to your business
                    workspace.
                  </p>
                </div>
              </div>

              <form
                className="workspace-form"
                onSubmit={addProduct}
              >
                <FormField label="Product name">
                  <input
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        name: e.target.value,
                      })
                    }
                    required
                    maxLength={120}
                    placeholder="e.g. Jollof Rice Bowl"
                  />
                </FormField>

                <FormField label="SKU (optional)">
                  <input
                    value={productForm.sku}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        sku: e.target.value,
                      })
                    }
                    placeholder="MENU-001"
                  />
                </FormField>

                <FormField label="Category">
                  <input
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
                    placeholder="Main course"
                  />
                </FormField>

                <FormField label="Selling price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.unit_price}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        unit_price: e.target.value,
                      })
                    }
                    required
                    placeholder="2500"
                  />
                </FormField>

                <FormField label="Unit cost">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.cost_price}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        cost_price: e.target.value,
                      })
                    }
                    required
                    placeholder="1200"
                  />
                </FormField>

                <FormField label="Opening stock">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={productForm.stock_quantity}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stock_quantity: e.target.value,
                      })
                    }
                    required
                    placeholder="25"
                  />
                </FormField>

                <div className="workspace-form-action">
                  <button
                    className="button button-primary button-sm"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? (
                      <LoaderCircle
                        size={15}
                        className="spin"
                      />
                    ) : (
                      <Plus size={15} />
                    )}
                    Save product
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="panel workspace-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>
                  {section === "inventory"
                    ? "Stock control"
                    : "Your menu and products"}
                </h2>
                <p>
                  {products.length} product record
                  {products.length === 1 ? "" : "s"} · changes
                  are saved to Supabase
                </p>
              </div>
            </div>

            {loading ? (
              <p className="workspace-muted">
                Loading products…
              </p>
            ) : !products.length ? (
              <Empty
                title="No products added yet"
                detail="Add your first menu item above to begin tracking prices, costs and stock."
              />
            ) : (
              <div className="workspace-table-wrap">
                <table className="workspace-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Cost</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                          <small>
                            {product.category || "Uncategorized"}
                            {product.sku
                              ? ` · ${product.sku}`
                              : ""}
                          </small>
                        </td>

                        <td>
                          {money(
                            Number(product.unit_price),
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            Number(product.cost_price),
                            currency
                          )}
                          <small>
                            {Number(product.unit_price) > 0
                              ? `${(
                                  ((Number(
                                    product.unit_price
                                  ) -
                                    Number(
                                      product.cost_price
                                    )) /
                                    Number(
                                      product.unit_price
                                    )) *
                                  100
                                ).toFixed(1)}% gross margin`
                              : "No price"}
                          </small>
                        </td>

                        <td>
                          {section === "inventory" ? (
                            <input
                              className="stock-input"
                              aria-label={`Stock quantity for ${product.name}`}
                              type="number"
                              min="0"
                              step="0.001"
                              value={
                                stockEdits[product.id] ?? "0"
                              }
                              onChange={(e) =>
                                setStockEdits({
                                  ...stockEdits,
                                  [product.id]: e.target.value,
                                })
                              }
                            />
                          ) : (
                            Number(product.stock_quantity)
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-pill ${
                              !product.is_active
                                ? "status-muted"
                                : Number(
                                      product.stock_quantity
                                    ) <= 5
                                  ? "status-warning"
                                  : "status-success"
                            }`}
                          >
                            {!product.is_active
                              ? "Archived"
                              : Number(
                                    product.stock_quantity
                                  ) <= 5
                                ? "Low stock"
                                : "Active"}
                          </span>
                        </td>

                        <td>
                          <div className="workspace-actions">
                            {section === "inventory" && (
                              <button
                                className="button button-outline button-xs"
                                onClick={() =>
                                  void updateStock(product)
                                }
                                disabled={saving}
                              >
                                <Save size={13} /> Save stock
                              </button>
                            )}

                            <button
                              className="button button-outline button-xs"
                              onClick={() =>
                                void toggleProduct(product)
                              }
                              disabled={saving}
                            >
                              {product.is_active
                                ? "Archive"
                                : "Restore"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {section === "customers" && (
        <>
          <section className="panel workspace-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>
                  <Plus size={17} /> Add a customer
                </h2>
                <p>
                  Keep customer contact details organized in one
                  place.
                </p>
              </div>
            </div>

            <form
              className="workspace-form"
              onSubmit={addCustomer}
            >
              <FormField label="Full name">
                <input
                  value={customerForm.full_name}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      full_name: e.target.value,
                    })
                  }
                  required
                  placeholder="Customer name"
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="name@example.com"
                />
              </FormField>

              <FormField label="Phone">
                <input
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Phone number"
                />
              </FormField>

              <FormField label="Notes">
                <input
                  value={customerForm.notes}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Preferences or context"
                />
              </FormField>

              <div className="workspace-form-action">
                <button
                  className="button button-primary button-sm"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle
                      size={15}
                      className="spin"
                    />
                  ) : (
                    <Plus size={15} />
                  )}
                  Save customer
                </button>
              </div>
            </form>
          </section>

          <section className="panel workspace-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Customer directory</h2>
                <p>
                  {customers.length} saved customer record
                  {customers.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {loading ? (
              <p className="workspace-muted">
                Loading customers…
              </p>
            ) : !customers.length ? (
              <Empty
                title="No customers yet"
                detail="Add a customer above. You can associate them with sales when recording transactions."
              />
            ) : (
              <div className="workspace-table-wrap">
                <table className="workspace-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Added</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <strong>{customer.full_name}</strong>
                          {customer.notes && (
                            <small>{customer.notes}</small>
                          )}
                        </td>
                        <td>{customer.email || "—"}</td>
                        <td>{customer.phone || "—"}</td>
                        <td>
                          {dateLabel(
                            String(customer.created_at || "")
                          )}
                        </td>
                        <td>
                          <button
                            className="button button-outline button-xs"
                            onClick={() =>
                              void deleteCustomer(customer)
                            }
                            disabled={saving}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {(section === "sales" || section === "orders") && (
        <>
          {section === "sales" && (
            <>
              <div className="workspace-stat-grid">
                <div className="workspace-stat">
                  <span>Completed revenue</span>
                  <strong>{money(revenue, currency)}</strong>
                  <small>All loaded completed sales</small>
                </div>

                <div className="workspace-stat">
                  <span>Completed sales</span>
                  <strong>{completedSales.length}</strong>
                  <small>Transaction records</small>
                </div>

                <div className="workspace-stat">
                  <span>Average sale</span>
                  <strong>
                    {money(
                      completedSales.length
                        ? revenue / completedSales.length
                        : 0,
                      currency
                    )}
                  </strong>
                  <small>Revenue ÷ completed sales</small>
                </div>
              </div>

              <section className="panel workspace-panel">
                <div className="workspace-panel-heading">
                  <div>
                    <h2>
                      <Plus size={17} /> Record a sale
                    </h2>
                    <p>
                      Choose one product per sale. The sale and
                      line item are stored in Supabase.
                    </p>
                  </div>
                </div>

                {!products.some((p) => p.is_active) ? (
                  <div className="workspace-callout">
                    Add an active product in{" "}
                    <Link href="/dashboard/menu">
                      Menu Intelligence
                    </Link>{" "}
                    before recording a sale.
                  </div>
                ) : (
                  <form
                    className="workspace-form"
                    onSubmit={addSale}
                  >
                    <FormField label="Product">
                      <select
                        value={saleForm.product_id}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            product_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">
                          Choose product…
                        </option>

                        {products
                          .filter((p) => p.is_active)
                          .map((product) => (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {product.name} —{" "}
                              {money(
                                Number(product.unit_price),
                                currency
                              )}{" "}
                              ({Number(product.stock_quantity)} in
                              stock)
                            </option>
                          ))}
                      </select>
                    </FormField>

                    <FormField label="Customer (optional)">
                      <select
                        value={saleForm.customer_id}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            customer_id: e.target.value,
                          })
                        }
                      >
                        <option value="">
                          Walk-in customer
                        </option>

                        {customers.map((customer) => (
                          <option
                            key={customer.id}
                            value={customer.id}
                          >
                            {customer.full_name}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Quantity">
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={saleForm.quantity}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            quantity: e.target.value,
                          })
                        }
                        required
                      />
                    </FormField>

                    <FormField label="Discount">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={saleForm.discount_amount}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            discount_amount: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField label="Tax">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={saleForm.tax_amount}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            tax_amount: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField label="Notes">
                      <input
                        value={saleForm.notes}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Optional notes"
                      />
                    </FormField>

                    <div className="workspace-sale-total">
                      <span>Estimated total</span>
                      <strong>
                        {money(saleEstimate, currency)}
                      </strong>
                    </div>

                    <div className="workspace-form-action">
                      <button
                        className="button button-primary button-sm"
                        type="submit"
                        disabled={saving || !saleForm.product_id}
                      >
                        {saving ? (
                          <LoaderCircle
                            size={15}
                            className="spin"
                          />
                        ) : (
                          <Plus size={15} />
                        )}
                        Save sale
                      </button>
                    </div>
                  </form>
                )}
              </section>
            </>
          )}

          <section className="panel workspace-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>
                  {section === "orders"
                    ? "Order and transaction queue"
                    : "Recent sales"}
                </h2>
                <p>
                  {sales.length} transaction record
                  {sales.length === 1 ? "" : "s"} loaded
                </p>
              </div>

              <button
                className="button button-outline button-xs"
                onClick={exportCsv}
              >
                <ArrowDownToLine size={14} /> Export CSV
              </button>
            </div>

            {loading ? (
              <p className="workspace-muted">
                Loading sales…
              </p>
            ) : !salesForTable.length ? (
              <Empty
                title="No sales recorded"
                detail="Record your first sale to populate sales history, orders and revenue metrics."
              />
            ) : (
              <div className="workspace-table-wrap">
                <table className="workspace-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      {section === "orders" && (
                        <th>Update status</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {salesForTable.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <strong>
                            {sale.sale_number ||
                              sale.id.slice(0, 8)}
                          </strong>
                          {sale.notes && <small>{sale.notes}</small>}
                        </td>

                        <td>{dateLabel(sale.sold_at)}</td>

                        <td>
                          {money(
                            Number(sale.total_amount),
                            currency
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-pill ${
                              sale.status === "completed"
                                ? "status-success"
                                : sale.status === "cancelled" ||
                                    sale.status === "refunded"
                                  ? "status-warning"
                                  : "status-muted"
                            }`}
                          >
                            {sale.status}
                          </span>
                        </td>

                        {section === "orders" && (
                          <td>
                            <select
                              aria-label={`Update status for ${
                                sale.sale_number || sale.id
                              }`}
                              className="status-select"
                              value={sale.status}
                              onChange={(e) =>
                                void updateSaleStatus(
                                  sale,
                                  e.target.value
                                )
                              }
                              disabled={saving}
                            >
                              <option value="draft">Draft</option>
                              <option value="completed">
                                Completed
                              </option>
                              <option value="refunded">
                                Refunded
                              </option>
                              <option value="cancelled">
                                Cancelled
                              </option>
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {section === "insights" && (
        <>
          <div className="workspace-feature-banner">
            <span>
              <BrainCircuit size={22} />
            </span>

            <div>
              <strong>
                Business signals from your own records
              </strong>
              <p>
                Generate rules-based checks for low stock, low
                recorded margins and sales activity. These are
                explainable checks, not an LLM-generated diagnosis
                or a guarantee of future results.
              </p>
            </div>

            <div className="workspace-banner-actions">
              <Link
                className="button button-outline button-sm"
                href="/dashboard/ask"
              >
                Ask your business <ArrowRight size={14} />
              </Link>

              <button
                className="button button-primary button-sm"
                onClick={() => void generateInsights()}
                disabled={generating || loading}
              >
                {generating ? (
                  <LoaderCircle
                    size={15}
                    className="spin"
                  />
                ) : (
                  <Sparkles size={15} />
                )}
                Generate insights
              </button>
            </div>
          </div>

          <div className="workspace-stat-grid">
            <div className="workspace-stat">
              <span>Active products</span>
              <strong>
                {products.filter((p) => p.is_active).length}
              </strong>
              <small>Menu records</small>
            </div>

            <div className="workspace-stat">
              <span>Low-stock products</span>
              <strong>
                {
                  products.filter(
                    (p) =>
                      p.is_active &&
                      Number(p.stock_quantity) <= 5
                  ).length
                }
              </strong>
              <small>Five or fewer units</small>
            </div>

            <div className="workspace-stat">
              <span>Recent completed sales</span>
              <strong>
                {
                  completedSales.filter(
                    (s) =>
                      Date.now() -
                        new Date(s.sold_at).getTime() <=
                      30 * 86400000
                  ).length
                }
              </strong>
              <small>Last 30 days</small>
            </div>
          </div>

          <section className="panel workspace-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Saved insights</h2>
                <p>
                  Review recommendations and mark actions as they
                  are handled.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="workspace-muted">
                Loading insights…
              </p>
            ) : !savedInsights.length ? (
              <Empty
                title="No insights saved yet"
                detail="Select Generate insights to check your current products, stock and sales records."
              />
            ) : (
              <div className="workspace-insight-list">
                {savedInsights.map((insight) => (
                  <article
                    className="workspace-insight"
                    key={insight.id}
                  >
                    <span className="workspace-insight-icon">
                      <BrainCircuit size={18} />
                    </span>

                    <div className="workspace-insight-content">
                      <div className="workspace-insight-meta">
                        <span>{insight.insight_type}</span>

                        <span
                          className={`status-pill ${
                            insight.status === "actioned"
                              ? "status-success"
                              : insight.status === "dismissed"
                                ? "status-muted"
                                : "status-warning"
                          }`}
                        >
                          {insight.status}
                        </span>

                        <small>
                          {dateLabel(insight.created_at)}
                        </small>
                      </div>

                      <h3>{insight.title}</h3>
                      <p>{insight.summary}</p>

                      <div className="workspace-actions">
                        <button
                          className="button button-outline button-xs"
                          disabled={saving}
                          onClick={() =>
                            void setInsightStatus(
                              insight,
                              "reviewed"
                            )
                          }
                        >
                          Mark reviewed
                        </button>

                        <button
                          className="button button-outline button-xs"
                          disabled={saving}
                          onClick={() =>
                            void setInsightStatus(
                              insight,
                              "actioned"
                            )
                          }
                        >
                          Mark actioned
                        </button>

                        <button
                          className="button button-outline button-xs"
                          disabled={saving}
                          onClick={() =>
                            void setInsightStatus(
                              insight,
                              "dismissed"
                            )
                          }
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {section === "forecasting" && (
        <>
          <div className="workspace-feature-banner">
            <span>
              <Activity size={22} />
            </span>

            <div>
              <strong>Simple baseline forecast</strong>
              <p>
                Uses the average daily revenue of the most recent
                14 days with completed sales records. This is a
                basic planning estimate, not a trained predictive
                model.
              </p>
            </div>
          </div>

          <div className="workspace-stat-grid">
            <div className="workspace-stat">
              <span>Historical days with sales</span>
              <strong>{dailyEntries.length}</strong>
              <small>Up to 14 recent active days</small>
            </div>

            <div className="workspace-stat">
              <span>Average recorded day</span>
              <strong>{money(averageDaily, currency)}</strong>
              <small>Based on days with sales</small>
            </div>

            <div className="workspace-stat">
              <span>7-day baseline estimate</span>
              <strong>
                {money(averageDaily * 7, currency)}
              </strong>
              <small>Assumes recent average continues</small>
            </div>
          </div>

          <section className="panel workspace-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Recent revenue by date</h2>
                <p>
                  Only completed sales are included. Dates without
                  sales are not shown.
                </p>
              </div>
            </div>

            {!dailyEntries.length ? (
              <Empty
                title="Not enough history yet"
                detail="Record completed sales on several days to create a baseline forecast."
              />
            ) : (
              <div className="forecast-bars">
                {dailyEntries.map(([day, amount]) => (
                  <div
                    className="forecast-bar-row"
                    key={day}
                  >
                    <span>{dateLabel(day)}</span>

                    <div className="forecast-bar-track">
                      <div
                        className="forecast-bar-fill"
                        style={{
                          width: `${
                            Math.max(
                              2,
                              (amount /
                                Math.max(
                                  ...dailyEntries.map(
                                    ([, value]) => value
                                  ),
                                  1
                                )) *
                                100
                            )
                          }%`,
                        }}
                      />
                    </div>

                    <strong>{money(amount, currency)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {section === "reports" && (
        <>
          <div className="workspace-stat-grid">
            <div className="workspace-stat">
              <span>Completed revenue</span>
              <strong>{money(revenue, currency)}</strong>
              <small>From loaded completed sales</small>
            </div>

            <div className="workspace-stat">
              <span>Recorded expenses</span>
              <strong>
                {money(
                  expenses.reduce(
                    (sum, expense) =>
                      sum + Number(expense.amount || 0),
                    0
                  ),
                  currency
                )}
              </strong>
              <small>All loaded expense records</small>
            </div>

            <div className="workspace-stat">
              <span>Net after recorded expenses</span>
              <strong>
                {money(
                  revenue -
                    expenses.reduce(
                      (sum, expense) =>
                        sum + Number(expense.amount || 0),
                      0
                    ),
                  currency
                )}
              </strong>
              <small>
                Not full profit; product costs excluded
              </small>
            </div>
          </div>

          <section className="panel workspace-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>
                  <Plus size={17} /> Record an expense
                </h2>
                <p>
                  Track operating expenses for a clearer financial
                  picture.
                </p>
              </div>
            </div>

            <form
              className="workspace-form"
              onSubmit={addExpense}
            >
              <FormField label="Category">
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      category: e.target.value,
                    })
                  }
                >
                  <option>Supplies</option>
                  <option>Ingredients</option>
                  <option>Rent</option>
                  <option>Utilities</option>
                  <option>Transport</option>
                  <option>Staff</option>
                  <option>Marketing</option>
                  <option>Equipment</option>
                  <option>Other</option>
                </select>
              </FormField>

              <FormField label="Description">
                <input
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="What was this expense for?"
                />
              </FormField>

              <FormField label="Amount">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: e.target.value,
                    })
                  }
                  required
                  placeholder="5000"
                />
              </FormField>

              <FormField label="Date">
                <input
                  type="date"
                  value={expenseForm.spent_at}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      spent_at: e.target.value,
                    })
                  }
                  required
                />
              </FormField>

              <div className="workspace-form-action">
                <button
                  className="button button-primary button-sm"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle
                      size={15}
                      className="spin"
                    />
                  ) : (
                    <Plus size={15} />
                  )}
                  Save expense
                </button>
              </div>
            </form>
          </section>

          <section className="panel workspace-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Recent expenses</h2>
                <p>
                  Expense records stored in Supabase.
                </p>
              </div>

              <button
                className="button button-outline button-xs"
                onClick={exportCsv}
              >
                <ArrowDownToLine size={14} /> Export sales CSV
              </button>
            </div>

            {!recentExpenses.length ? (
              <Empty
                title="No expenses recorded"
                detail="Add expenses above to track operating costs."
              />
            ) : (
              <div className="workspace-table-wrap">
                <table className="workspace-table">
                  <thead>
                    <tr>
                      <th>Expense</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>
                          <strong>
                            {expense.description ||
                              expense.category}
                          </strong>
                        </td>
                        <td>{expense.category}</td>
                        <td>{dateLabel(expense.spent_at)}</td>
                        <td>
                          {money(
                            Number(expense.amount),
                            currency
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel workspace-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Sales export</h2>
                <p>
                  Export the currently loaded sales history as
                  CSV.
                </p>
              </div>

              <button
                className="button button-primary button-sm"
                onClick={exportCsv}
              >
                <ArrowDownToLine size={15} /> Download sales CSV
              </button>
            </div>
          </section>
        </>
      )}

      {section === "settings" && (
        <>
          <section className="panel workspace-panel settings-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Business profile</h2>
                <p>
                  These preferences apply to this workspace.
                </p>
              </div>
            </div>

            <form
              className="workspace-form"
              onSubmit={saveSettings}
            >
              <FormField label="Business name">
                <input
                  value={settingsForm.name}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      name: e.target.value,
                    })
                  }
                  required
                  maxLength={120}
                />
              </FormField>

              <FormField label="Business type">
                <select
                  value={settingsForm.business_type}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      business_type: e.target.value,
                    })
                  }
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Café</option>
                  <option value="catering">Catering</option>
                  <option value="bakery">Bakery</option>
                  <option value="hotel">Hotel</option>
                  <option value="food_truck">Food truck</option>
                  <option value="other">Other</option>
                </select>
              </FormField>

              <FormField label="Currency">
                <select
                  value={settingsForm.currency}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      currency: e.target.value,
                    })
                  }
                >
                  <option value="NGN">
                    NGN — Nigerian naira
                  </option>
                  <option value="USD">USD — US dollar</option>
                  <option value="GBP">
                    GBP — Pound sterling
                  </option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GHS">
                    GHS — Ghanaian cedi
                  </option>
                  <option value="KES">
                    KES — Kenyan shilling
                  </option>
                </select>
              </FormField>

              <FormField label="Time zone">
                <select
                  value={settingsForm.timezone}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      timezone: e.target.value,
                    })
                  }
                >
                  <option value="Africa/Lagos">
                    Africa/Lagos
                  </option>
                  <option value="Africa/Accra">
                    Africa/Accra
                  </option>
                  <option value="Africa/Nairobi">
                    Africa/Nairobi
                  </option>
                  <option value="Europe/London">
                    Europe/London
                  </option>
                  <option value="America/New_York">
                    America/New_York
                  </option>
                  <option value="UTC">UTC</option>
                </select>
              </FormField>

              <div className="workspace-form-action">
                <button
                  className="button button-primary button-sm"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle
                      size={15}
                      className="spin"
                    />
                  ) : (
                    <Save size={15} />
                  )}
                  Save settings
                </button>
              </div>
            </form>

            <div className="workspace-callout">
              Access isolation is enforced by Supabase Row Level
              Security policies. Test with separate user accounts
              before using real customer data in production.
            </div>
          </section>

          {/* Marketplace restaurant photo upload */}
          <section className="panel workspace-panel settings-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Marketplace restaurant photo</h2>
                <p>
                  Upload the actual photo of your restaurant that
                  customers will see when they discover your
                  business in the TasteAI marketplace.
                </p>
              </div>

              <ImagePlus size={22} />
            </div>

            {restaurantImageUrl && (
              <div style={{ marginBottom: 20 }}>
                <p className="workspace-muted">
                  Current marketplace photo
                </p>

                <img
                  src={restaurantImageUrl}
                  alt="Your restaurant"
                  style={{
                    width: "100%",
                    maxWidth: 420,
                    height: 220,
                    objectFit: "cover",
                    borderRadius: 12,
                    display: "block",
                  }}
                />
              </div>
            )}

            {!marketplaceRestaurantId ? (
              <div className="workspace-callout">
                Your business does not have a marketplace
                restaurant listing yet. Create or publish your
                restaurant listing before uploading a photo.
              </div>
            ) : (
              <>
                <FormField label="Choose restaurant photo (JPG, PNG or WebP — maximum 5 MB)">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selectRestaurantPhoto}
                    disabled={uploadingRestaurantPhoto}
                  />
                </FormField>

                {restaurantPhotoFile && (
                  <p className="workspace-muted">
                    Selected: {restaurantPhotoFile.name}
                  </p>
                )}

                <div className="workspace-form-action">
                  <button
                    type="button"
                    className="button button-primary button-sm"
                    onClick={() =>
                      void uploadRestaurantPhoto()
                    }
                    disabled={
                      !restaurantPhotoFile ||
                      uploadingRestaurantPhoto
                    }
                  >
                    {uploadingRestaurantPhoto ? (
                      <LoaderCircle
                        size={15}
                        className="spin"
                      />
                    ) : (
                      <ImagePlus size={15} />
                    )}

                    {uploadingRestaurantPhoto
                      ? "Uploading photo..."
                      : "Upload restaurant photo"}
                  </button>
                </div>
              </>
            )}
          </section>
        </>
      )}

      <p className="workspace-security-note">
        <CheckCircle2 size={15} /> This module reads and writes
        the signed-in workspace through Supabase's authenticated
        client and existing Row Level Security policies.
      </p>
    </div>
  );
}