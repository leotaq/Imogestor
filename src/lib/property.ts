export function normalizePropertyCode(raw: string): string {
  return raw.trim().toUpperCase()
}

function normalizeComparableText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export function composePropertyAddress(opts: {
  street: string
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
}): string {
  const street = (opts.street || "").trim()
  if (!street) return ""

  const parts = [street]
  const hasPart = (value: string) =>
    normalizeComparableText(parts.join(", ")).includes(
      normalizeComparableText(value)
    )

  const number = (opts.number || "").trim()
  if (number && !hasPart(number)) parts.push(number)

  const complement = (opts.complement || "").trim()
  if (complement && !hasPart(complement)) parts.push(complement)

  const neighborhood = (opts.neighborhood || "").trim()
  if (neighborhood && !hasPart(neighborhood)) parts.push(neighborhood)

  const city = (opts.city || "").trim()
  if (city && !hasPart(city)) parts.push(city)

  return parts.join(", ")
}
