import { z } from "zod";

export const uploadSchema = z.object({
    regulationType: z.string().min(1, "Jenis peraturan harus diisi"),
    number: z.string().min(1, "Nomor peraturan harus diisi"),
    year: z.string().regex(/^\d{4}$/, "Tahun harus 4 digit angka"),
    title: z.string().optional(),
    existingRegulationId: z.string().optional().nullable(),
});

export const loginSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
});

export const versionSchema = z.object({
    number: z.string().min(1),
    year: z.number().int().min(1945).max(new Date().getFullYear() + 1),
    fullTitle: z.string().min(5),
    status: z.enum(["ACTIVE", "AMENDED", "REVOKED"]),
});
