"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import NavbarClient from "./NavbarClient";

const NavbarAdvanced = () => {
  const { user, isLoaded } = useUser();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountType, setAccountType] = useState<"CANDIDATE" | "EMPLOYER" | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded || !user) return;

    let active = true;
    fetch("/api/account-type", { method: "GET" })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!active || !data) return;
        setUserId(data.userId);
        setIsAdmin(data.role === "ADMIN");
        setAccountType(data.accountType);
      })
      .catch(() => {
        // Non-blocking: navbar still renders from Clerk identity.
      });

    return () => {
      active = false;
    };
  }, [isLoaded, user]);

  return (
    <NavbarClient
      user={
        user
          ? {
              name: user.fullName || user.username || null,
              email: user.primaryEmailAddress?.emailAddress || null,
              image: user.imageUrl || null,
            }
          : null
      }
      userId={userId}
      isAdmin={isAdmin}
      accountType={accountType}
    />
  );
};

export default NavbarAdvanced;