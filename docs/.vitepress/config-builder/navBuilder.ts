import type { DefaultTheme } from "vitepress";
import type { DocProject } from "./types";

const PROJECTS_LABEL = "プロジェクト";
const UNCATEGORIZED_LABEL = "カテゴリーなし";

export function buildProjectsDropdown(
  projects: DocProject[],
): DefaultTheme.NavItemWithChildren {
  const groups: DefaultTheme.NavItemChildren[] = [];

  for (const project of projects) {
    const category: string = project.category?.trim() || UNCATEGORIZED_LABEL;
    const link: DefaultTheme.NavItemWithLink = {
      text: project.label,
      link: project.path,
    };

    const group = groups.find((g) => g.text === category);
    if (group) {
      group.items.push(link);
    } else {
      groups.push({ text: category, items: [link] });
    }
  }

  return {
    text: PROJECTS_LABEL,
    items: groups,
  };
}

export function buildRepositoriesDropdown(
  projects: DocProject[],
): DefaultTheme.NavItemWithChildren {
  const items: DefaultTheme.NavItemWithLink[] = projects
    .filter(hasRepoUrl)
    .map((project) => ({
      text: project.label,
      link: project.repoUrl,
      target: "_blank",
      rel: "noreferrer",
    }));

  return {
    text: "Repositories",
    items: items,
  };
}

function hasRepoUrl(
  project: DocProject,
): project is DocProject & { repoUrl: string } {
  return typeof project.repoUrl === "string" && project.repoUrl.length > 0;
}
