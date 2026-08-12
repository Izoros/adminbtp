import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Les tests Vitest executent aussi les services serveur hors du bundler Next.js.
vi.mock("server-only", () => ({}));
