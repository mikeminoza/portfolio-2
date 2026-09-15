import { defineQuery } from "next-sanity";

export const profileQuery = defineQuery(`
  *[_type == "profile"][0]{
    name,
    title,
    intro,
    email,
    location,
    socials[]{ label, href }
  }
`);

export const experienceQuery = defineQuery(`
  *[_type == "role"] | order(order asc){
    company,
    title,
    period,
    employment,
    highlights
  }
`);

export const projectsQuery = defineQuery(`
  *[_type == "project"] | order(order asc, year desc){
    "slug": slug.current,
    title,
    summary,
    year,
    role,
    kind,
    stack,
    repo,
    demo,
    cover{ ..., alt }
  }
`);

export const skillsQuery = defineQuery(`
  *[_type == "skillGroup"] | order(order asc){
    title,
    items
  }
`);

export const educationQuery = defineQuery(`
  *[_type == "education"][0]{
    degree,
    school,
    period,
    honors
  }
`);
