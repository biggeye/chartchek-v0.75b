'use client'

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Thread } from "@/types/types";
import { useRouter } from "next/navigation";

export function ThreadList() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchThreads = async () => {
            const { data, error } = await createClient()
                .from("chat_threads")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) {
                console.error("[ThreadList] Error fetching threads:", error);
                return;
            }
            setThreads(data || []);
        }
        fetchThreads();
    }, []);

    return (
   
            <ul>
                {threads.map((thread) => (
                    <li key={thread.id}>
                        {thread.id}
                    </li>   
                ))}
            </ul>

    )
}