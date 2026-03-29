import type { DocProject, ProjectEntry, ProjectsConfig } from './types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface ParseResult<T> extends ValidationResult {
  value?: T
}

export function validateName(name: string): ValidationResult {
  if (!/^[a-zA-Z0-9-]+$/.test(name)) {
    return {
      valid: false,
      errors: [
        `Invalid name "${name}": name must contain only alphanumeric characters and hyphens.`,
      ],
    }
  }
  return { valid: true, errors: [] }
}

export function validatePath(path: string): ValidationResult {
  const errors: string[] = []
  if (!path.startsWith('/')) {
    errors.push(`Invalid path "${path}": path must start with "/".`)
  }
  if (!path.endsWith('/')) {
    errors.push(`Invalid path "${path}": path must end with "/".`)
  }
  return { valid: errors.length === 0, errors }
}

export function validateDocProject(project: DocProject): ValidationResult {
  const nameResult = validateName(project.name)
  const pathResult = validatePath(project.path)
  const errors = [...nameResult.errors, ...pathResult.errors]
  return { valid: errors.length === 0, errors }
}

export function parseProjectsConfig(raw: unknown): ParseResult<ProjectsConfig> {
  if (!isRecord(raw)) {
    return {
      valid: false,
      errors: ['projects.json root must be an object: { "<category>": ProjectEntry[] }'],
    }
  }

  const errors: string[] = []
  const config: ProjectsConfig = {}

  for (const [category, entries] of Object.entries(raw)) {
    if (!Array.isArray(entries)) {
      errors.push(`Category "${category}" must be an array.`)
      continue
    }

    const normalizedEntries: ProjectEntry[] = []
    entries.forEach((entry, index) => {
      const parsedEntry = parseProjectEntry(entry, category, index)
      if (!parsedEntry.valid || !parsedEntry.value) {
        errors.push(...parsedEntry.errors)
        return
      }
      normalizedEntries.push(parsedEntry.value)
    })

    config[category] = normalizedEntries
  }

  return { valid: errors.length === 0, errors, value: config }
}

function parseProjectEntry(
  raw: unknown,
  category: string,
  index: number,
): ParseResult<ProjectEntry> {
  const entryPath = `${category}[${index}]`
  if (!isRecord(raw)) {
    return { valid: false, errors: [`${entryPath} must be an object.`] }
  }

  const { name, label, description, icon } = raw
  const errors: string[] = []

  if (typeof name !== 'string' || name.length === 0) {
    errors.push(`${entryPath}.name must be a non-empty string.`)
  }
  if (typeof label !== 'string' || label.length === 0) {
    errors.push(`${entryPath}.label must be a non-empty string.`)
  }
  if (description !== undefined && typeof description !== 'string') {
    errors.push(`${entryPath}.description must be a string when provided.`)
  }
  if (icon !== undefined && typeof icon !== 'string') {
    errors.push(`${entryPath}.icon must be a string when provided.`)
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    errors: [],
    value: {
      name,
      label,
      description,
      icon,
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
