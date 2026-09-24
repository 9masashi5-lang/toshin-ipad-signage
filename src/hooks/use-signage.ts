"use client";

import { useEffect, useState } from "react";
import { subscribeToSignage, type ConnectionState } from "@/lib/signage-store";
import { defaultSignageState, type SignageState } from "@/types/signage";

export function useSignage() {
  const [signage, setSignage] = useState<SignageState>(defaultSignageState);
  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(
    () =>
      subscribeToSignage(setSignage, (state, message = "") => {
        setConnection(state);
        setConnectionMessage(message);
      }),
    [],
  );
  return { signage, connection, connectionMessage };
}
