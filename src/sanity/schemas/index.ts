import type { SchemaTypeDefinition } from "sanity";
import { education } from "./education";
import { profile } from "./profile";
import { project } from "./project";
import { role } from "./role";
import { skillGroup } from "./skill-group";

export const schemaTypes: SchemaTypeDefinition[] = [
  profile,
  role,
  project,
  skillGroup,
  education,
];
