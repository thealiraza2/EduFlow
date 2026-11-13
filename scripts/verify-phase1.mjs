// scripts/verify-phase1.mjs

async function runVerification() {
  const baseUrl = "http://localhost:3000";

  console.log("=== Phase 1 Verification Test Suite ===");

  // Helper to extract specific cookie or all cookies from Set-Cookie headers
  function extractCookies(response) {
    const rawCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
    if (!rawCookies.length && response.headers.get("set-cookie")) {
      // In older fetch implementations, set-cookie might be a single string with commas
      const sc = response.headers.get("set-cookie");
      rawCookies.push(...sc.split(/,(?=[^;]+=[^;]+)/));
    }
    return rawCookies.map((c) => c.split(";")[0].trim()).join("; ");
  }

  // 1. Visit /admin while logged out
  console.log("\n[Test 1] Visit /admin while logged out...");
  const loggedOutRes = await fetch(`${baseUrl}/admin`, { redirect: "manual" });
  console.log(`Status: ${loggedOutRes.status}, Location: ${loggedOutRes.headers.get("location")}`);
  if (loggedOutRes.status === 307 && loggedOutRes.headers.get("location")?.includes("/login")) {
    console.log("✓ PASS: Logged-out access to /admin redirected to /login");
  } else {
    throw new Error(`FAIL: Expected 307 redirect to /login, got ${loggedOutRes.status}`);
  }

  // Helper to login and get session cookies
  async function login(email, password) {
    // 1. Get CSRF token
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfCookies = extractCookies(csrfRes);

    // 2. Post credentials
    const params = new URLSearchParams();
    params.set("csrfToken", csrfData.csrfToken);
    params.set("email", email);
    params.set("password", password);
    params.set("redirectTo", `${baseUrl}/admin`);

    const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: csrfCookies,
      },
      body: params.toString(),
      redirect: "manual",
    });

    const sessionCookies = extractCookies(loginRes);
    const combined = `${csrfCookies}; ${sessionCookies}`;
    return combined;
  }

  // 2. Login as admin
  console.log("\n[Test 2] Login as Admin (admin@academyhub.test)...");
  const adminCookies = await login("admin@academyhub.test", "Admin123!");
  console.log("Admin logged in successfully. Session cookie obtained.");

  // 3. Visit /admin as admin
  console.log("\n[Test 3] Visit /admin as Admin...");
  const adminAdminRes = await fetch(`${baseUrl}/admin`, {
    headers: { Cookie: adminCookies },
    redirect: "manual",
  });
  console.log(`Status: ${adminAdminRes.status}`);
  if (adminAdminRes.status === 200) {
    console.log("✓ PASS: Admin successfully accesses /admin (HTTP 200)");
  } else {
    throw new Error(`FAIL: Admin visiting /admin returned status ${adminAdminRes.status}`);
  }

  // 4. Visit /teacher as admin
  console.log("\n[Test 4] Visit /teacher as Admin...");
  const adminTeacherRes = await fetch(`${baseUrl}/teacher`, {
    headers: { Cookie: adminCookies },
    redirect: "manual",
  });
  console.log(`Status: ${adminTeacherRes.status}`);
  if (adminTeacherRes.status === 200) {
    console.log("✓ PASS: Admin allowed to visit /teacher (HTTP 200)");
  } else {
    throw new Error(`FAIL: Admin visiting /teacher returned status ${adminTeacherRes.status}`);
  }

  // 5. Login as parent
  console.log("\n[Test 5] Login as Parent (parent@academyhub.test)...");
  const parentCookies = await login("parent@academyhub.test", "Parent123!");
  console.log("Parent logged in successfully. Session cookie obtained.");

  // 6. Visit /admin as parent (should be blocked)
  console.log("\n[Test 6] Visit /admin as Parent (should be blocked)...");
  const parentAdminRes = await fetch(`${baseUrl}/admin`, {
    headers: { Cookie: parentCookies },
    redirect: "manual",
  });
  console.log(`Status: ${parentAdminRes.status}`);
  if (parentAdminRes.status === 403) {
    console.log("✓ PASS: Parent account visiting /admin is blocked (HTTP 403 Forbidden)");
  } else {
    throw new Error(`FAIL: Parent visiting /admin was not blocked! Got status ${parentAdminRes.status}`);
  }

  console.log("\n=== ALL PHASE 1 TESTS PASSED SUCCESSFULLY ===");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
