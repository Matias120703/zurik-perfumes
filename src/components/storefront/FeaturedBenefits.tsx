"use client";

import { motion, useReducedMotion } from "framer-motion";

import { benefits, type Benefit } from "@/config/benefits";
import { siteConfig } from "@/config/site";
import { sectionContainerVariants as container, sectionItemVariants as item } from "@/lib/motion";

export function FeaturedBenefits() {
  const shouldReduceMotion = useReducedMotion();
  const { eyebrow, title, subtitle } = siteConfig.featuredBenefitsSection;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
      <div className="flex flex-col items-center gap-3 text-center">
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
        viewport={{ once: true, amount: 0.2 }}
        variants={container}
        className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-4"
      >
        {benefits.map((benefit) => (
          <BenefitCard key={benefit.id} benefit={benefit} />
        ))}
      </motion.div>
    </section>
  );
}

function BenefitCard({ benefit }: { benefit: Benefit }) {
  const Icon = benefit.icon;

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group flex flex-col items-center gap-4 text-center md:items-start md:text-left"
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted transition-colors duration-300 group-hover:bg-muted/70">
        <Icon className="size-5 text-foreground" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-foreground">{benefit.title}</h3>
        <p className="text-sm text-muted-foreground">{benefit.description}</p>
      </div>
    </motion.div>
  );
}
