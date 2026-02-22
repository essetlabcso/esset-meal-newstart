import test from "node:test";
import assert from "node:assert/strict";

const contextKeyModule = await import("../../src/lib/projects/contextKey.ts");
const navSchemaModule = await import("../../src/lib/nav/navSchema.ts");

const { getActiveProjectCookieName } = contextKeyModule;
const { buildProjectRoute, getProjectNavItems } = navSchemaModule;

test("active project cookie name is org-scoped and deterministic", () => {
  assert.equal(
    getActiveProjectCookieName("org_123"),
    "esset_active_project_org_123"
  );
  assert.equal(
    getActiveProjectCookieName("9f6a-tenant"),
    "esset_active_project_9f6a-tenant"
  );
});

test("project nav has 7 items when analytics is disabled", () => {
  const previous = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_NAV;
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_NAV = "false";

  const navItems = getProjectNavItems();
  const labels = navItems.map((item) => item.label);
  const expectedOrderWithoutAnalytics = [
    "Home",
    "Analyze",
    "Strategy",
    "Plan (MEAL)",
    "Collect (Evidence)",
    "Learn & Decide",
    "Reports",
  ];

  assert.equal(navItems.length, 7);
  assert.deepEqual(labels, expectedOrderWithoutAnalytics);
  assert.equal(labels.includes("Analytics"), false);

  if (previous === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_NAV;
  } else {
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_NAV = previous;
  }
});

test("project nav has 8 items when analytics is enabled and analytics is last", () => {
  const previous = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_NAV;
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_NAV = "true";

  const navItems = getProjectNavItems();
  const labels = navItems.map((item) => item.label);
  const expectedOrderWithAnalytics = [
    "Home",
    "Analyze",
    "Strategy",
    "Plan (MEAL)",
    "Collect (Evidence)",
    "Learn & Decide",
    "Reports",
    "Analytics",
  ];

  assert.equal(navItems.length, 8);
  assert.deepEqual(labels, expectedOrderWithAnalytics);
  assert.equal(labels[labels.length - 1], "Analytics");

  if (previous === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_NAV;
  } else {
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_NAV = previous;
  }
});

test("project route builder always targets org-scoped project routes", () => {
  assert.equal(
    buildProjectRoute("orgA", "projectB", "home"),
    "/app/orgA/projects/projectB/home"
  );
  assert.equal(
    buildProjectRoute("orgA", "projectB", "collect"),
    "/app/orgA/projects/projectB/collect"
  );
});
