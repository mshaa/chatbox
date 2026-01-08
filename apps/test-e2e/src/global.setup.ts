import { seed } from "@chatbox/persistence";

export default async function globalSetup() {
  console.log('Seeding database');
  await seed();
}