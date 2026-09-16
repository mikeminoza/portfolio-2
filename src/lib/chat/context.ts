import "server-only";

import {
  getEducation,
  getExperience,
  getProfile,
  getProjects,
  getSkills,
} from "@/lib/content";
import type { ChatContext } from "@/lib/chat/engine";

/**
 * Assembles the facts the assistant may use, server-side.
 *
 * Deliberately not taken from the request: if the client supplied it, anyone
 * could rewrite the profile the model answers from and make the site state
 * things about him that aren't true.
 */
export async function buildContext(): Promise<ChatContext> {
  const [profile, roles, projects, skills, education] = await Promise.all([
    getProfile(),
    getExperience(),
    getProjects(),
    getSkills(),
    getEducation(),
  ]);

  return { profile, roles, projects, skills, education };
}
