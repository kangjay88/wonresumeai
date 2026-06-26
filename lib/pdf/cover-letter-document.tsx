import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { CoverLetterContent } from "@/lib/types";

/** Cover-letter PDF, matching the resume's typography (Helvetica, single column). */

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#111111",
  },
  name: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  contact: {
    fontSize: 9.5,
    color: "#555555",
    marginBottom: 24,
  },
  greeting: {
    marginBottom: 12,
  },
  paragraph: {
    marginBottom: 12,
  },
  closing: {
    marginTop: 12,
  },
});

export function CoverLetterDocument({ content }: { content: CoverLetterContent }) {
  const { contact, greeting, paragraphs, closing } = content;
  const contactLine = [contact.email, contact.phone, contact.location]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <Document title={`Cover letter — ${contact.name || ""}`} author={contact.name || undefined}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.name}>{contact.name || "Your Name"}</Text>
        {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}

        {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}

        {paragraphs
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}

        {closing ? (
          <View style={styles.closing}>
            <Text>{closing}</Text>
            <Text>{contact.name}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
