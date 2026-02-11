"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  FileStack,
  Lock,
  Menu,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const workflowImage =
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80"

const navItems = [
  { label: "Fitur", href: "#fitur" },
  { label: "Alur", href: "#alur" },
  { label: "Keamanan", href: "#keamanan" },
  { label: "Use Case", href: "#use-case" },
  { label: "Kontak", href: "#kontak" },
]

interface DesignAgencyProps {
  isAuthenticated?: boolean
}

export function DesignAgency({ isAuthenticated = false }: DesignAgencyProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 text-foreground">
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
        className={`sticky top-0 z-50 border-b bg-background/95 backdrop-blur ${isScrolled ? "shadow-md" : ""}`}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <p className="text-base font-semibold">PUU Tracker</p>
              <p className="text-xs text-muted-foreground">Regulatory Intelligence</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Login</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link href="/compare">Coba Bandingkan</Link>
            </Button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen((v) => !v)} aria-label="Toggle navigation">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.header>

      {isMenuOpen && (
        <div className="border-b bg-background md:hidden">
          <div className="mx-auto w-full max-w-7xl space-y-2 px-4 py-4 md:px-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {isAuthenticated ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Login</Link>
                </Button>
              )}
              <Button asChild className="w-full">
                <Link href="/compare">Coba Bandingkan</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <main>
        <section className="w-full bg-[radial-gradient(circle_at_top_right,oklch(0.64_0.22_255_/_0.06),transparent_50%)]">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-24">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Legal Enterprise Platform
            </span>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Telaah Perubahan Regulasi Lebih Cepat, Presisi, dan Siap Audit.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              PUU Tracker membantu tim legal dan compliance membandingkan perubahan pasal secara verbatim, menjaga
              jejak versi, dan mempercepat pengambilan keputusan berbasis dokumen resmi.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="sm:min-w-44">
                <Link href="/compare">
                  Coba Bandingkan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="sm:min-w-44">
                <Link href="/dashboard">Lihat Dashboard</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-card/60 p-3">
                <p className="text-2xl font-semibold">70%</p>
                <p className="text-xs text-muted-foreground">Percepatan telaah dokumen</p>
              </div>
              <div className="rounded-xl border bg-card/60 p-3">
                <p className="text-2xl font-semibold">100%</p>
                <p className="text-xs text-muted-foreground">Jejak versi terdokumentasi</p>
              </div>
              <div className="rounded-xl border bg-card/60 p-3">
                <p className="text-2xl font-semibold">24/7</p>
                <p className="text-xs text-muted-foreground">Akses pemantauan perubahan</p>
              </div>
            </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl border"
            >
              <Image src={workflowImage} alt="Analisis dokumen regulasi" width={900} height={700} className="h-full w-full object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white">
                <p className="text-sm font-semibold">Regulatory Change Monitoring</p>
                <p className="text-xs text-white/80">Upload, parse, compare, dan review dalam satu alur kerja.</p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="w-full border-y border-border/60 bg-muted/10">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Risiko Missed Update",
                desc: "Perubahan pasal sering terlewat saat review manual lintas dokumen.",
                icon: <FileSearch className="h-5 w-5" />,
              },
              {
                title: "Proses Telaah Lambat",
                desc: "Tim harus membandingkan versi lama dan baru secara baris per baris.",
                icon: <Clock3 className="h-5 w-5" />,
              },
              {
                title: "Audit Trail Terbatas",
                desc: "Sulit menelusuri kapan perubahan terjadi dan dampaknya ke kebijakan.",
                icon: <FileStack className="h-5 w-5" />,
              },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeIn} className="rounded-2xl border bg-card p-5">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">{item.icon}</div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
            </motion.div>
          </div>
        </section>

        <section id="alur" className="w-full">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="mb-8 text-center">
            <p className="text-sm font-semibold text-primary">Alur Kerja</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Dari Dokumen ke Insight Perubahan</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Alur sederhana untuk mengidentifikasi perubahan regulasi tanpa kehilangan konteks pasal.
            </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Upload", desc: "Unggah dokumen PDF regulasi.", icon: <Upload className="h-5 w-5" /> },
              { step: "02", title: "Parse", desc: "Ekstraksi teks dan struktur pasal.", icon: <Search className="h-5 w-5" /> },
              { step: "03", title: "Compare", desc: "Bandingkan versi secara verbatim.", icon: <Scale className="h-5 w-5" /> },
              { step: "04", title: "Review", desc: "Validasi hasil untuk tindak lanjut.", icon: <CheckCircle2 className="h-5 w-5" /> },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeIn} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">STEP {item.step}</span>
                  <span className="rounded-md bg-primary/10 p-2 text-primary">{item.icon}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
            </motion.div>
          </div>
        </section>

        <section id="fitur" className="w-full bg-muted/5">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="mb-8 text-center">
            <p className="text-sm font-semibold text-primary">Fitur Utama</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Dirancang untuk Tim Legal Enterprise</h2>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Upload Dokumen", desc: "Validasi format dan ukuran agar proses stabil." },
              { title: "Ekstraksi Cerdas", desc: "Parsing teks pasal dari dokumen PDF kompleks." },
              { title: "Versioning Regulasi", desc: "Status ACTIVE, AMENDED, REVOKED tercatat jelas." },
              { title: "Diff Verbatim", desc: "Perubahan kalimat ditampilkan detail dan terstruktur." },
              { title: "Pencarian Terarah", desc: "Filter jenis, tahun, dan keyword untuk akses cepat." },
              { title: "Kolaborasi Tim", desc: "Bagikan hasil telaah untuk sinkronisasi kebijakan." },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeIn} className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
            </motion.div>
          </div>
        </section>

        <section id="keamanan" className="w-full">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <div className="rounded-2xl border bg-card p-6 md:p-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <p className="text-sm font-semibold text-primary">Keamanan & Keandalan</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Siap untuk Lingkungan Compliance</h2>
                <p className="mt-3 text-sm text-muted-foreground md:text-base">
                  PUU Tracker mendukung kontrol akses, jejak audit versi, dan proses review terstruktur untuk membantu
                  tim memenuhi standar tata kelola dokumen hukum.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3">
                    <p className="text-xl font-semibold">Role-based</p>
                    <p className="text-xs text-muted-foreground">Akses terkontrol</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-xl font-semibold">Traceable</p>
                    <p className="text-xs text-muted-foreground">Riwayat versi lengkap</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { title: "Role Access", icon: <Users className="h-4 w-4" />, desc: "Kontrol hak akses per peran pengguna." },
                  { title: "Audit Trail", icon: <FileStack className="h-4 w-4" />, desc: "Riwayat perubahan versi terdokumentasi." },
                  { title: "Data Integrity", icon: <ShieldCheck className="h-4 w-4" />, desc: "Dokumen sumber tetap terlacak." },
                  { title: "Secure Pipeline", icon: <Lock className="h-4 w-4" />, desc: "Alur upload dan parsing lebih aman." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border p-4">
                    <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                      {item.icon}
                      {item.title}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            </div>
          </div>
        </section>

        <section id="use-case" className="w-full">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="mb-8 text-center">
            <p className="text-sm font-semibold text-primary">Use Case</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Dipakai oleh Tim dengan Kebutuhan Review Tinggi</h2>
            </motion.div>

            <div className="grid gap-3 lg:grid-cols-3">
            {[
              { title: "Tim Legal Korporasi", desc: "Mengecek dampak perubahan regulasi terhadap klausul internal." },
              { title: "Tim Compliance", desc: "Memastikan kebijakan operasional selalu selaras regulasi terbaru." },
              { title: "Tim Policy & Risk", desc: "Menganalisis perubahan pasal untuk mitigasi risiko bisnis." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {[
              {
                quote:
                  "Waktu telaah perubahan pasal turun drastis karena tim tidak lagi membandingkan dokumen secara manual.",
                by: "Head of Legal, Fintech Nusantara",
              },
              {
                quote:
                  "Audit internal jadi lebih lancar karena histori versi dan status perubahan sudah terdokumentasi jelas.",
                by: "Compliance Lead, InsurAsia",
              },
            ].map((item) => (
              <div key={item.by} className="rounded-2xl border bg-card p-5">
                <p className="text-sm text-muted-foreground">&quot;{item.quote}&quot;</p>
                <p className="mt-3 text-sm font-semibold">{item.by}</p>
              </div>
            ))}
            </div>
          </div>
        </section>

        <section id="kontak" className="w-full bg-muted/5">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 pb-24 md:px-6 md:py-16 md:pb-20">
            <div className="grid gap-3 rounded-2xl border bg-card p-6 md:p-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-primary">Kontak</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Mulai dengan Uji Coba Alur Perbandingan</h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Ceritakan kebutuhan tim Anda. Kami bantu susun alur kerja yang sesuai untuk monitoring perubahan
                regulasi secara berkelanjutan.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/compare">Coba Bandingkan</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/upload">Upload Regulasi</Link>
                </Button>
              </div>
            </div>

            <form className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Nama depan" />
                <Input placeholder="Nama belakang" />
              </div>
              <Input type="email" placeholder="Email" />
              <Textarea placeholder="Tulis kebutuhan atau use case tim Anda" className="min-h-28" />
              <Button type="submit" className="w-full">Kirim Pesan</Button>
            </form>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur md:hidden">
        <Button asChild className="w-full">
          <Link href="/compare">Coba Bandingkan Sekarang</Link>
        </Button>
      </div>
    </div>
  )
}
