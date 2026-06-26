"use client";

import { useState } from "react";

import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeSections,
} from "@/lib/types";

/**
 * Reusable section-based editor over ResumeSections. Used by the onboarding
 * confirmation step and the resume builder. Fully controlled: the parent owns
 * the sections state and receives an updated copy on every edit.
 */
export function ResumeSectionsEditor({
  sections,
  onChange,
}: {
  sections: ResumeSections;
  onChange: (next: ResumeSections) => void;
}) {
  function update(mutate: (next: ResumeSections) => void) {
    const next = structuredClone(sections);
    mutate(next);
    onChange(next);
  }

  return (
    <div className="space-y-8">
      <Section title="Contact">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Name"
            value={sections.contact.name}
            onChange={(v) => update((n) => (n.contact.name = v))}
          />
          <Field
            label="Email"
            value={sections.contact.email}
            onChange={(v) => update((n) => (n.contact.email = v))}
          />
          <Field
            label="Phone"
            value={sections.contact.phone}
            onChange={(v) => update((n) => (n.contact.phone = v))}
          />
          <Field
            label="Location"
            value={sections.contact.location}
            onChange={(v) => update((n) => (n.contact.location = v))}
          />
          <Field
            label="LinkedIn"
            value={sections.contact.linkedin}
            onChange={(v) => update((n) => (n.contact.linkedin = v))}
          />
          <Field
            label="Website"
            value={sections.contact.website}
            onChange={(v) => update((n) => (n.contact.website = v))}
          />
        </div>
      </Section>

      <Section title="Summary">
        <TextArea
          value={sections.summary}
          rows={3}
          onChange={(v) => update((n) => (n.summary = v))}
        />
      </Section>

      <Section title="Skills">
        <ChipList
          items={sections.skills}
          placeholder="Add a skill"
          onChange={(items) => update((n) => (n.skills = items))}
        />
      </Section>

      <Section title="Experience">
        <div className="space-y-4">
          {sections.experience.map((role, i) => (
            <ExperienceCard
              key={i}
              role={role}
              onChange={(r) => update((n) => (n.experience[i] = r))}
              onRemove={() => update((n) => n.experience.splice(i, 1))}
            />
          ))}
          <AddButton
            label="Add role"
            onClick={() =>
              update((n) =>
                n.experience.push({
                  company: "",
                  title: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  bullets: [],
                })
              )
            }
          />
        </div>
      </Section>

      <Section title="Education">
        <div className="space-y-4">
          {sections.education.map((edu, i) => (
            <EducationCard
              key={i}
              edu={edu}
              onChange={(e) => update((n) => (n.education[i] = e))}
              onRemove={() => update((n) => n.education.splice(i, 1))}
            />
          ))}
          <AddButton
            label="Add education"
            onClick={() =>
              update((n) =>
                n.education.push({
                  school: "",
                  degree: "",
                  field: "",
                  startDate: "",
                  endDate: "",
                  details: "",
                })
              )
            }
          />
        </div>
      </Section>

      <Section title="Projects">
        <div className="space-y-4">
          {sections.projects.map((proj, i) => (
            <ProjectCard
              key={i}
              project={proj}
              onChange={(p) => update((n) => (n.projects[i] = p))}
              onRemove={() => update((n) => n.projects.splice(i, 1))}
            />
          ))}
          <AddButton
            label="Add project"
            onClick={() =>
              update((n) =>
                n.projects.push({
                  name: "",
                  description: "",
                  link: "",
                  bullets: [],
                })
              )
            }
          />
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section cards
// ---------------------------------------------------------------------------

function ExperienceCard({
  role,
  onChange,
  onRemove,
}: {
  role: ExperienceEntry;
  onChange: (r: ExperienceEntry) => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof ExperienceEntry>(
    key: K,
    value: ExperienceEntry[K]
  ) => onChange({ ...role, [key]: value });

  return (
    <div className="space-y-3 rounded-md border border-gray-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Title" value={role.title} onChange={(v) => set("title", v)} />
        <Field
          label="Company"
          value={role.company}
          onChange={(v) => set("company", v)}
        />
        <Field
          label="Location"
          value={role.location}
          onChange={(v) => set("location", v)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Start (MMM YYYY)"
            value={role.startDate}
            onChange={(v) => set("startDate", v)}
          />
          <Field
            label="End (or Present)"
            value={role.endDate}
            onChange={(v) => set("endDate", v)}
          />
        </div>
      </div>
      <BulletsEditor bullets={role.bullets} onChange={(b) => set("bullets", b)} />
      <RemoveButton onClick={onRemove} label="Remove role" />
    </div>
  );
}

function EducationCard({
  edu,
  onChange,
  onRemove,
}: {
  edu: EducationEntry;
  onChange: (e: EducationEntry) => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof EducationEntry>(
    key: K,
    value: EducationEntry[K]
  ) => onChange({ ...edu, [key]: value });

  return (
    <div className="space-y-3 rounded-md border border-gray-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="School" value={edu.school} onChange={(v) => set("school", v)} />
        <Field label="Degree" value={edu.degree} onChange={(v) => set("degree", v)} />
        <Field label="Field" value={edu.field} onChange={(v) => set("field", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Start"
            value={edu.startDate}
            onChange={(v) => set("startDate", v)}
          />
          <Field
            label="End"
            value={edu.endDate}
            onChange={(v) => set("endDate", v)}
          />
        </div>
      </div>
      <Field label="Details" value={edu.details} onChange={(v) => set("details", v)} />
      <RemoveButton onClick={onRemove} label="Remove education" />
    </div>
  );
}

function ProjectCard({
  project,
  onChange,
  onRemove,
}: {
  project: ProjectEntry;
  onChange: (p: ProjectEntry) => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof ProjectEntry>(key: K, value: ProjectEntry[K]) =>
    onChange({ ...project, [key]: value });

  return (
    <div className="space-y-3 rounded-md border border-gray-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name" value={project.name} onChange={(v) => set("name", v)} />
        <Field label="Link" value={project.link} onChange={(v) => set("link", v)} />
      </div>
      <Field
        label="Description"
        value={project.description}
        onChange={(v) => set("description", v)}
      />
      <BulletsEditor bullets={project.bullets} onChange={(b) => set("bullets", b)} />
      <RemoveButton onClick={onRemove} label="Remove project" />
    </div>
  );
}

/** Bullets edited as one-per-line; blank lines dropped on blur. */
function BulletsEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">
        Bullets (one per line)
      </label>
      <textarea
        value={bullets.join("\n")}
        rows={Math.max(3, bullets.length)}
        onChange={(e) =>
          onChange(
            e.target.value.split("\n").map((line) => line.replace(/^[-•*]\s*/, ""))
          )
        }
        onBlur={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.replace(/^[-•*]\s*/, "").trim())
              .filter(Boolean)
          )
        }
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Primitives (exported for reuse, e.g. onboarding's target-roles chips)
// ---------------------------------------------------------------------------

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          {title}
        </h2>
        {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
      />
    </label>
  );
}

export function TextArea({
  value,
  rows,
  onChange,
}: {
  value: string;
  rows: number;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
    />
  );
}

export function ChipList({
  items,
  placeholder,
  onChange,
}: {
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add() {
    const value = input.trim();
    if (!value || items.includes(value)) {
      setInput("");
      return;
    }
    onChange([...items, value]);
    setInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-sm"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        placeholder={placeholder}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
      />
    </div>
  );
}

export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900"
    >
      + {label}
    </button>
  );
}

export function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-red-500 hover:text-red-700"
    >
      {label}
    </button>
  );
}
