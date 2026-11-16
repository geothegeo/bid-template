"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { endSession, hashPassword, isAdminEmail, requireAdmin, startSession, verifyPassword } from "@/lib/auth";
import { HOME } from "@/lib/boards";
import { slugify, validateEmail, validateName } from "@/lib/validation";

const text = (form: FormData, key: string) => String(form.get(key) ?? "");
const fail = (path: string, message: string): never => redirect(`${path}?error=${encodeURIComponent(message)}`);

function guard<T>(path: string, fn: () => Promise<T>) {
  return fn().catch((error) => {
    if (error && typeof error === "object" && "digest" in error) throw error; // redirect
    return fail(path, error instanceof Error ? error.message : "Something went wrong.");
  });
}

export async function register(form: FormData) {
  await guard("/register", async () => {
    const email = validateEmail(text(form, "email"));
    const username = validateName(text(form, "username"), 30);
    const password = text(form, "password");
    if (password.length < 8 || password.length > 200) throw new Error("Password must be at least 8 characters.");
    if (await db.user.findFirst({ where: { OR: [{ email }, { username }] } })) throw new Error("That email or username is taken.");
    const user = await db.user.create({
      data: { email, username, passwordHash: await hashPassword(password), role: isAdminEmail(email) ? "admin" : "user" },
    });
    await startSession(user.id);
  });
  redirect("/dashboard");
}

export async function login(form: FormData) {
  await guard("/login", async () => {
    const user = await db.user.findUnique({ where: { email: text(form, "email").trim().toLowerCase() } });
    if (!user || !(await verifyPassword(text(form, "password"), user.passwordHash))) throw new Error("Wrong email or password.");
    await startSession(user.id);
  });
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/");
}

/** R-CAT-03: anyone can suggest; hidden until approved. */
export async function suggestCategory(form: FormData) {
  await guard("/post", async () => {
    const name = validateName(text(form, "name"));
    const parentId = text(form, "parentId") || null;
    if (parentId && !(await db.category.findFirst({ where: { id: parentId, parentId: null, approved: true } }))) throw new Error("Unknown parent.");
    await db.category.create({ data: { name, slug: `${slugify(name)}-${Date.now().toString(36)}`, parentId, approved: false, suggestedBy: text(form, "email").slice(0, 254) || null } });
  });
  redirect("/post?suggested=1");
}

export async function createCategory(form: FormData) {
  await guard("/admin", async () => {
    await requireAdmin();
    const name = validateName(text(form, "name"));
    const parentId = text(form, "parentId") || null;
    if (parentId && !(await db.category.findFirst({ where: { id: parentId, parentId: null } }))) {
      throw new Error("Categories are limited to two levels.");
    }
    let slug = slugify(name);
    if (await db.category.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    await db.category.create({ data: { name, slug, parentId, sortOrder: Number(text(form, "sortOrder")) || 0 } });
  });
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function updateCategory(form: FormData) {
  await guard("/admin", async () => {
    await requireAdmin();
    await db.category.update({
      where: { id: text(form, "id") },
      data: { name: validateName(text(form, "name")), sortOrder: Number(text(form, "sortOrder")) || 0, approved: form.get("approve") ? true : undefined },
    });
  });
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteCategory(form: FormData) {
  await guard("/admin", async () => {
    await requireAdmin();
    const id = text(form, "id");
    const [children, listings] = await Promise.all([db.category.count({ where: { parentId: id } }), db.listing.count({ where: { categoryId: id } })]);
    if (children || listings) throw new Error("Only empty categories can be deleted.");
    await db.boardConfig.deleteMany({ where: { scopeKey: id } });
    await db.category.delete({ where: { id } });
  });
  revalidatePath("/", "layout");
  redirect("/admin");
}

/** R-FEE-01: per-board rules. Form fields are in dollars; plans are "months:dollars" lines. */
export async function saveBoardConfig(form: FormData) {
  await guard("/admin", async () => {
    await requireAdmin();
    const scopeKey = text(form, "scopeKey");
    if (scopeKey !== HOME && !(await db.category.findUnique({ where: { id: scopeKey } }))) throw new Error("Unknown board.");
    const minBid = Number(text(form, "minBid"));
    const inc = Number(text(form, "increment"));
    if (!Number.isInteger(minBid) || minBid < 1 || !Number.isInteger(inc) || inc < 1) throw new Error("Minimum bid and increment must be whole dollars of at least 1.");
    const unrankedPlans = text(form, "plans").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
      const [m, d] = line.split(":").map((s) => Number(s.trim()));
      if (!Number.isInteger(m) || m < 1 || m > 60 || !Number.isInteger(d) || d < 1) throw new Error(`Bad plan "${line}". Use months:dollars, e.g. 6:60.`);
      return { months: m, cents: d * 100 };
    });
    if (!unrankedPlans.length) throw new Error("Add at least one unranked plan.");
    const data = { minBidCents: minBid * 100, minIncrementCents: inc * 100, unrankedPlans };
    await db.boardConfig.upsert({ where: { scopeKey }, update: data, create: { scopeKey, ...data } });
  });
  redirect("/admin?saved=1");
}
