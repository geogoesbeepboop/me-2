"use client";

import dynamic from "next/dynamic";

/** Client-only loader — three.js never touches the server bundle. */
const HeroField = dynamic(() => import("./HeroField"), {
  ssr: false,
  loading: () => null,
});

export default HeroField;
