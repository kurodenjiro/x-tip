"use client"

import CreateDropLink from "@/components/create-drop-link";
import { useContractInteraction } from "@/hooks/useContractInteraction";
import { useUserQuery } from "@/hooks/useQuery";
import Link from "next/link";

export default function CreateDropLinkPage() {
    const { isLoggedIn, currentAccountId } = useContractInteraction();
    const { data: user, isLoading, isError } = useUserQuery(currentAccountId || "");

    return (
        <div className="container mx-auto p-4">
            <Link href="/" className="text-blue-500 underline mb-4 inline-block">Return to Home</Link>
            <CreateDropLink user={user} />
        </div>
    );
}