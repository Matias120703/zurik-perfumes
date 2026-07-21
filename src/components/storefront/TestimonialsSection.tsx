"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";

import { siteConfig } from "@/config/site";
import { testimonials, type Testimonial } from "@/config/testimonials";
import { cn } from "@/lib/utils";
import { sectionContainerVariants as container, sectionItemVariants as item } from "@/lib/motion";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

export function TestimonialsSection() {
  const shouldReduceMotion = useReducedMotion();
  const { eyebrow, title, subtitle } = siteConfig.testimonialsSection;

  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="max-w-md text-muted-foreground">{subtitle}</p>
      </div>

      <motion.div
        initial={shouldReduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={container}
        className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </motion.div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-[82%] shrink-0 snap-start md:w-auto md:shrink"
    >
      <div className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-lg">
        <StarRating rating={testimonial.rating} />

        <p className="flex-1 text-sm leading-relaxed text-foreground">
          “{testimonial.comment}”
        </p>

        {/*
          testimonial.avatar queda reservado para cuando haya foto real.
          Hasta entonces se muestra un avatar con las iniciales del nombre.
        */}
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {getInitials(testimonial.name)}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {testimonial.name}
            </span>
            <span className="text-xs text-muted-foreground">{testimonial.city}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            "size-4",
            index < rating
              ? "fill-foreground text-foreground"
              : "fill-transparent text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}
