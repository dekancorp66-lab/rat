import { createFileRoute } from "@tanstack/react-router";
import { GalleryPage } from "@/components/gallery-page";

export const Route = createFileRoute("/")({ component: GalleryPage });
