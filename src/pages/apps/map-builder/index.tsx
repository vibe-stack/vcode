import React from 'react';
import AppLayout from "@/layouts/AppLayout";
import { GamepadIcon } from "lucide-react";

export default function MapBuilderPage() {
    return (
        <AppLayout
            title="Map Builder"
            description="Create and edit maps with an intuitive interface, perfect for game development or simulations."
            icon={GamepadIcon}
            backTo="/?section=apps">
            <p>Map Builder content goes here.</p>
        </AppLayout>
    )
}