"use client";

import { LocalUser } from "./types";

const USER_KEY = "ai-session-live-user";

const ADJECTIFS = [
  "Rapide", "Calme", "Vif", "Sage", "Bold", "Zen", "Nova", "Pixel",
];
const ANIMAUX = [
  "Lynx", "Faucon", "Panda", "Loup", "Ours", "Renard", "Aigle", "Chat",
];

function randomName(): string {
  const adj = ADJECTIFS[Math.floor(Math.random() * ADJECTIFS.length)];
  const animal = ANIMAUX[Math.floor(Math.random() * ANIMAUX.length)];
  return `${adj} ${animal}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function getOrCreateUser(): LocalUser {
  if (typeof window === "undefined") {
    return { id: "server", nom: "Invité" };
  }

  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    return JSON.parse(stored) as LocalUser;
  }

  const user: LocalUser = { id: generateId(), nom: randomName() };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function updateUserName(nom: string): LocalUser {
  const user = getOrCreateUser();
  const updated = { ...user, nom };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}
