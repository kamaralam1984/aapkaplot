"use client";

import { useEffect, useState } from "react";
import { NearbyCustomEditor } from "./NearbyCustomEditor";
import type { PoiCategory } from "@/lib/property-poi";

interface NearbyEntry {
  id: string;
  name: string;
  category: PoiCategory;
  distanceKm: number;
}

interface Props {
  propertyId: string;
  ownerUid: string;
  initial: NearbyEntry[];
}

export function NearbyCustomEditorGate({ propertyId, ownerUid, initial }: Props) {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ session, isAdmin }) => {
        if (!session) return;
        setCanEdit(session.uid === ownerUid || !!isAdmin);
      })
      .catch(() => {});
  }, [ownerUid]);

  if (!canEdit) return null;
  return <NearbyCustomEditor propertyId={propertyId} initial={initial} />;
}
