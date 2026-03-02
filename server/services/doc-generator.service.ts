import type { Project } from "../../shared/types";

export interface GeneratedDoc {
  slug: string;
  title: string;
  content: string;
}

export class DocGeneratorService {
  /**
   * Generates a set of starter project docs based on the project's metadata.
   * Returns an ordered array ready to be inserted into project_docs.
   */
  generate(project: Project): GeneratedDoc[] {
    const docs: GeneratedDoc[] = [];

    // 1. Project Overview
    docs.push({
      slug: "overview",
      title: "Project Overview",
      content: this.buildOverview(project),
    });

    // 2. Tech Stack (only if tags are present)
    if (project.tags && project.tags.length > 0) {
      docs.push({
        slug: "tech-stack",
        title: "Tech Stack",
        content: this.buildTechStack(project),
      });
    }

    // 3. Getting Started
    docs.push({
      slug: "getting-started",
      title: "Getting Started",
      content: this.buildGettingStarted(project),
    });

    return docs;
  }

  private buildOverview(project: Project): string {
    const lines: string[] = [];

    lines.push(
      `${project.displayName} is a project managed in ConsoleBlue.`,
    );

    if (project.description) {
      lines.push("", project.description);
    }

    if (project.productionUrl) {
      lines.push("", `**Production URL:** ${project.productionUrl}`);
    }

    if (project.subdomainUrl) {
      lines.push(`**Subdomain:** ${project.subdomainUrl}`);
    }

    if (project.githubRepo) {
      const owner = project.githubOwner || "triadblue";
      lines.push(
        `**Repository:** https://github.com/${owner}/${project.githubRepo}`,
      );
    }

    lines.push("", `**Status:** ${project.status}`);

    return lines.join("\n");
  }

  private buildTechStack(project: Project): string {
    const tags = project.tags || [];
    const lines: string[] = [
      "The following technologies and tools are used in this project:",
      "",
    ];

    for (const tag of tags) {
      lines.push(`- ${tag}`);
    }

    return lines.join("\n");
  }

  private buildGettingStarted(project: Project): string {
    const lines: string[] = [
      "Follow these steps to work with this project:",
      "",
    ];

    if (project.githubRepo) {
      const owner = project.githubOwner || "triadblue";
      lines.push(
        `1. Clone the repository: \`git clone https://github.com/${owner}/${project.githubRepo}.git\``,
      );
      lines.push(
        `2. Checkout the default branch: \`git checkout ${project.defaultBranch || "main"}\``,
      );
      lines.push("3. Install dependencies (see repository README for details)");
      lines.push("4. Configure environment variables as needed");
      lines.push("5. Start the development server");
    } else {
      lines.push("1. Review project settings in ConsoleBlue");
      lines.push("2. Link a GitHub repository to enable code access");
      lines.push("3. Add project-specific documentation as needed");
    }

    return lines.join("\n");
  }
}

export const docGeneratorService = new DocGeneratorService();
