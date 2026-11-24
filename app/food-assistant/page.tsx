
import type { Metadata } from "next";
import FoodAssistant from "@/components/food-assistant";
import "./food-assistant.css";

export const metadata: Metadata = {
  title: "Food Assistant | TasteAI Enterprise",
  description:
    "Discover food recommendations based on your location, preferences and budget.",
};

export default function FoodAssistantPage() {
  return <FoodAssistant />;
}
