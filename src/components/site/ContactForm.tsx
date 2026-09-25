"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    honeypot: "", // Bot trap
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus("error");
      setErrorMessage("Bitte füllen Sie alle erforderlichen Felder aus.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Beim Senden ist ein Fehler aufgetreten.");
      }

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        honeypot: "",
      });
    } catch (err: unknown) {
      setStatus("error");
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Ein unerwarteter Fehler ist aufgetreten. Bitte kontaktieren Sie uns direkt.");
      }
    }
  };

  return (
    <div className="rounded-xl bg-card p-6 shadow-lg sm:p-8">
      {status === "success" ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-6 text-center text-foreground animate-in fade-in duration-300">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Vielen Dank für Ihre Anfrage!
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Ihre Nachricht wurde erfolgreich übermittelt. Unser Team wird Ihre Anfrage zeitnah prüfen und sich mit Ihnen in Verbindung setzen.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="inline-flex items-center justify-center rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow transition hover:opacity-90 cursor-pointer"
          >
            Weitere Nachricht senden
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Honeypot field for bot protection (hidden from humans) */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              value={formData.honeypot}
              onChange={handleChange}
            />
          </div>

          {status === "error" && (
            <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive animate-in fade-in">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Senden fehlgeschlagen</p>
                <p className="mt-0.5 text-xs opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Name / Firma <span className="text-signal">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              disabled={status === "loading"}
              value={formData.name}
              onChange={handleChange}
              placeholder="Ihr Name oder Firmenname"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                E-Mail <span className="text-signal">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={status === "loading"}
                value={formData.email}
                onChange={handleChange}
                placeholder="ihre.adresse@firma.de"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Telefon <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                disabled={status === "loading"}
                value={formData.phone}
                onChange={handleChange}
                placeholder="+49 ..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Ihre Anfrage <span className="text-signal">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              disabled={status === "loading"}
              value={formData.message}
              onChange={handleChange}
              placeholder="Beschreiben Sie kurz Ihr Vorhaben, Stückzahlen oder Anforderungen..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:opacity-50 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-signal px-6 py-3 text-sm font-semibold text-accent-foreground shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Wird gesendet...</span>
              </>
            ) : (
              "Anfrage senden"
            )}
          </button>

          <p className="text-xs text-muted-foreground">
            Hinweis: Sie können uns Ihre Anfrage auch direkt per E-Mail an{" "}
            <a href="mailto:info@ahi-tec.de" className="underline text-foreground hover:text-signal">
              info@ahi-tec.de
            </a>{" "}
            oder telefonisch unter{" "}
            <a href="tel:+4923549429870" className="underline text-foreground hover:text-signal">
              +49 2354 9429870
            </a>{" "}
            senden.
          </p>
        </form>
      )}
    </div>
  );
}
