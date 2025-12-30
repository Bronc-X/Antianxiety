import MobileLayout from "@/components/mobile/MobileLayout";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <MobileLayout>
            {children}
        </MobileLayout>
    );
}
