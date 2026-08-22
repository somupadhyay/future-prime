import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native-web";
import { catalogItems } from "./catalog";
import { clearSession, loadSession, saveSession } from "./session";
import { loginRequest, logoutRequest, refreshRequest } from "./api";
import { colors, radius, shadow, spacing } from "./theme";

function useHashRoute() {
  const [route, setRoute] = useState(() => {
    if (typeof window === "undefined") {
      return "home";
    }

    const current = window.location.hash.replace("#", "").trim();
    return current === "login" ? "login" : "home";
  });

  useEffect(() => {
    const syncRoute = () => {
      const current = window.location.hash.replace("#", "").trim();
      setRoute(current === "login" ? "login" : "home");
    };

    window.addEventListener("hashchange", syncRoute);
    syncRoute();
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const navigate = (nextRoute) => {
    const normalized = nextRoute === "login" ? "login" : "home";
    const hash = `#${normalized}`;

    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setRoute(normalized);
    }
  };

  return [route, navigate];
}

function App() {
  const [route, navigate] = useHashRoute();
  const [session, setSession] = useState(() => loadSession());
  const updateSession = (nextSession) => {
    if (nextSession) {
      saveSession(nextSession);
    } else {
      clearSession();
    }
    setSession(nextSession);
  };

  return route === "login" && !session ? (
    <LoginScreen
      onNavigateHome={() => navigate("home")}
      onSessionChange={updateSession}
      onSignedIn={() => navigate("home")}
    />
  ) : (
    <HomeScreen session={session} onSessionChange={updateSession} onNavigateLogin={() => navigate("login")} />
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>FP</Text>
      </View>
      <View>
        <Text style={styles.brandName}>Future Prime</Text>
        <Text style={styles.brandTagline}>Everest-inspired operations</Text>
      </View>
    </View>
  );
}

function ActionButton({ label, onPress, variant = "primary", compact = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "ghost" && styles.buttonGhost,
        compact && styles.buttonCompact,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === "secondary" && styles.buttonLabelSecondary,
          variant === "ghost" && styles.buttonLabelGhost,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function NavButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}>
      <Text style={styles.navButtonLabel}>{label}</Text>
    </Pressable>
  );
}

function Chip({ label, active, onPress, tone = "default" }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.buttonPressed]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive, tone === "success" && styles.chipLabelSuccess]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

function MetricCard({ value, label }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function CatalogCard({ item }) {
  return (
    <View style={styles.catalogCard}>
      <View style={styles.catalogHeader}>
        <View>
          <View style={[styles.badge, item.badgeTone === "success" ? styles.badgeSuccess : styles.badgePrimary]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
          <Text style={styles.catalogTitle}>{item.name}</Text>
        </View>
        <Text style={styles.catalogPrice}>{item.price}</Text>
      </View>

      <Text style={styles.catalogDescription}>{item.description}</Text>

      <View style={styles.tagRow}>
        {item.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HomeScreen({ session, onSessionChange, onNavigateLogin }) {
  const scrollRef = useRef(null);
  const sectionOffsets = useRef({ catalog: 0, about: 0, contact: 0 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("");
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    document.title = "Future Prime | Home";
  }, []);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return catalogItems.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesFilter = filter === "all" || item.tags.some((tag) => tag.toLowerCase() === filter);
      return matchesSearch && matchesFilter;
    });
  }, [filter, search]);

  const scrollToSection = (key) => {
    const y = sectionOffsets.current[key] || 0;
    scrollRef.current?.scrollTo({ y: Math.max(y - 18, 0), animated: true });
  };

  const onSectionLayout = (key) => (event) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const updateSession = (nextSession) => {
    onSessionChange(nextSession);
  };

  const handleRefresh = async () => {
    if (!session?.refreshToken) {
      setStatus("Please sign in first to refresh the session.");
      return;
    }

    setBusyAction("refresh");
    setStatus("Refreshing session...");

    try {
      const data = await refreshRequest(session.refreshToken);
      const nextSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        user: data.user,
      };
      updateSession(nextSession);
      setStatus("Session refreshed successfully.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleLogout = async () => {
    if (!session?.refreshToken) {
      updateSession(null);
      setStatus("Local session cleared.");
      return;
    }

    setBusyAction("logout");
    setStatus("Logging out...");

    try {
      await logoutRequest(session.refreshToken);
      setStatus("You have been logged out.");
    } catch (error) {
      setStatus(`${error.message} Signed out locally.`);
    } finally {
      updateSession(null);
      setBusyAction("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Brand />
            <View style={styles.topNav}>
              <NavButton label="Catalog" onPress={() => scrollToSection("catalog")} />
              <NavButton label="About" onPress={() => scrollToSection("about")} />
              <NavButton label="Contact" onPress={() => scrollToSection("contact")} />
              <NavButton label={session ? "Logout" : "Login"} onPress={session ? handleLogout : onNavigateLogin} />
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroColumn}>
              <Text style={styles.eyebrow}>Mt. Everest inspired business system</Text>
              <Text style={styles.heroTitle}>Calm, clear, and resilient — like a climb to the summit.</Text>
              <Text style={styles.heroText}>
                Future Prime now carries a colder alpine visual language across the project, with a snowline palette and glacier-style surfaces for the home and login
                pages.
              </Text>

              <View style={styles.actionRow}>
                <ActionButton label="Explore catalog" onPress={() => scrollToSection("catalog")} />
                {!session && <ActionButton label="Go to login" variant="secondary" onPress={onNavigateLogin} />}
              </View>

              <View style={styles.metricRow}>
                <MetricCard value="6+" label="catalog categories ready for expansion" />
                <MetricCard value="3" label="core session actions: login, refresh, logout" />
                <MetricCard value="1" label="cohesive home page with catalog, about, and contact" />
              </View>
            </View>

            <View style={[styles.heroColumn, styles.sessionPanel]}>
              <Text style={styles.panelTitle}>Summit session</Text>
              {session?.user ? (
                <>
                  <Text style={styles.panelHeadline}>Welcome back, {session.user.fullName}</Text>
                  <Text style={styles.panelText}>Email: {session.user.email}</Text>
                  <Text style={styles.panelText}>Role: {session.user.role}</Text>
                  <Text style={styles.panelText}>Entity: {session.user.accessibleEntities?.map((entity) => entity.name).join(", ") || "Future Prime"}</Text>

                  <View style={styles.actionRow}>
                    <ActionButton label={busyAction === "refresh" ? "Refreshing..." : "Refresh session"} variant="secondary" onPress={handleRefresh} compact />
                    <ActionButton label={busyAction === "logout" ? "Logging out..." : "Logout"} variant="ghost" onPress={handleLogout} compact />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.panelHeadline}>Sign in to unlock session actions</Text>
                  <Text style={styles.panelText}>Use the login page to open the seeded admin session, then come back here to refresh or end it.</Text>
                  <ActionButton label="Open login page" onPress={onNavigateLogin} />
                </>
              )}

              {!!status && <Text style={styles.statusText}>{status}</Text>}
            </View>
          </View>

          <View onLayout={onSectionLayout("catalog")} style={styles.section}>
            <SectionHeading
              eyebrow="Alpine product catalog"
              title="Browse featured categories"
              description="This starter catalog keeps the familiar product-home-page feel, but now matches the Everest theme with cool tones and glacier-style surfaces."
            />

            <View style={styles.controlsRow}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search catalog items"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
              <View style={styles.filterRow}>
                <Chip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
                <Chip label="Catalog" active={filter === "catalog"} onPress={() => setFilter("catalog")} />
                <Chip label="Inventory" active={filter === "inventory"} onPress={() => setFilter("inventory")} />
                <Chip label="Service" active={filter === "service"} onPress={() => setFilter("service")} />
                <Chip label="Safety" active={filter === "safety"} onPress={() => setFilter("safety")} />
              </View>
            </View>

            <View style={styles.catalogGrid}>
              {visibleItems.map((item) => (
                <CatalogCard key={item.name} item={item} />
              ))}
            </View>
          </View>

          <View onLayout={onSectionLayout("about")} style={[styles.section, styles.sectionAlt]}>
            <View style={styles.twoColumn}>
              <View style={styles.infoCard}>
                <Text style={styles.eyebrow}>About</Text>
                <Text style={styles.sectionTitle}>Built for a growing operations business</Text>
                <Text style={styles.bodyText}>
                  Future Prime is shaping up as the central system for product catalogs, stock, quotations, import tracking, service history, and technician workflows.
                </Text>
                <View style={styles.listBlock}>
                  <Text style={styles.listItem}>• Clear product-first presentation for customers and staff</Text>
                  <Text style={styles.listItem}>• Simple entry point for quotes, inventory, and support work</Text>
                  <Text style={styles.listItem}>• Session-aware UI that connects directly to the backend auth APIs</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.eyebrow}>Snowline foundation</Text>
                <Text style={styles.sectionTitle}>MVP-friendly, with a colder visual system</Text>
                <Text style={styles.bodyText}>
                  This page gives us a clean front door today and leaves room to expand into quote management, stock dashboards, and role-based navigation later.
                </Text>
                <View style={styles.listBlock}>
                  <Text style={styles.listItem}>• Login page wired to the existing JWT flow</Text>
                  <Text style={styles.listItem}>• Refresh and logout session actions ready to use</Text>
                  <Text style={styles.listItem}>• Easy path to add a real API-backed product catalog later</Text>
                </View>
              </View>
            </View>
          </View>

          <View onLayout={onSectionLayout("contact")} style={styles.section}>
            <View style={styles.twoColumn}>
              <View style={styles.infoCard}>
                <Text style={styles.eyebrow}>Contact</Text>
                <Text style={styles.sectionTitle}>Let’s make the first release feel solid</Text>
                <Text style={styles.bodyText}>
                  Use this area for the public-facing business contact details, support inbox, or sales line.
                </Text>

                <View style={styles.contactBlock}>
                  <Pressable onPress={() => (window.location.href = "mailto:hello@futureprime.com")}>
                    <Text style={styles.contactLink}>hello@futureprime.com</Text>
                  </Pressable>
                  <Pressable onPress={() => (window.location.href = "tel:+9779800000000")}>
                    <Text style={styles.contactLink}>+977 98000 00000</Text>
                  </Pressable>
                  <Text style={styles.contactText}>Open Monday to Saturday, 9:00 AM to 6:00 PM</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.eyebrow}>Session tools</Text>
                <Text style={styles.sectionTitle}>Try the auth flow</Text>
                <Text style={styles.bodyText}>
                  Sign in on the login page with the seeded admin credentials, then come back here to refresh or end the session.
                </Text>
                <View style={styles.actionRow}>
                  {!session && <ActionButton label="Open login page" onPress={onNavigateLogin} />}
                  <ActionButton label="Refresh session" variant="secondary" onPress={handleRefresh} compact />
                  <ActionButton label="Logout" variant="ghost" onPress={handleLogout} compact />
                </View>
                {!!status && <Text style={styles.statusText}>{status}</Text>}
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© Future Prime</Text>
            <Text style={styles.footerTextMuted}>A polished alpine front door for the business platform.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LoginScreen({ onNavigateHome, onSessionChange, onSignedIn }) {
  const [email, setEmail] = useState("admin@futureprime.com");
  const [password, setPassword] = useState("Admin@1234");
  const [status, setStatus] = useState("");
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    document.title = "Future Prime | Login";
  }, []);

  const handleSubmit = async () => {
    if (loadSession()) {
      setStatus("You are already signed in on this browser. Log out before signing in again.");
      return;
    }

    setBusyAction("login");
    setStatus("Signing in...");

    try {
      const data = await loginRequest(email.trim(), password);
      const nextSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        user: data.user,
      };
      onSessionChange(nextSession);
      setStatus("Signed in successfully.");
      onSignedIn();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusyAction("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Brand />
            <View style={styles.topNav}>
              <NavButton label="Home" onPress={onNavigateHome} />
            </View>
          </View>

          <View style={styles.authHero}>
            <View style={styles.authColumn}>
              <Text style={styles.eyebrow}>Secure alpine access</Text>
              <Text style={styles.heroTitle}>Sign in to Future Prime</Text>
              <Text style={styles.heroText}>
                Use the login endpoint that is already working in Bruno, then land on the home page with your session stored locally.
              </Text>

              <View style={styles.formCard}>
                <Text style={styles.panelTitle}>Login details</Text>

                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="admin@futureprime.com"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />

                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Admin@1234"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />

                <View style={styles.actionRow}>
                  <ActionButton
                    label={busyAction === "login" ? "Signing in..." : "Sign in"}
                    onPress={handleSubmit}
                    compact
                  />
                  <ActionButton label="Back to home" variant="secondary" onPress={onNavigateHome} compact />
                </View>

                {!!status && <Text style={styles.statusText}>{status}</Text>}
              </View>
            </View>

            <View style={[styles.authColumn, styles.sessionPanel]}>
              <Text style={styles.panelTitle}>What this page does</Text>
              <Text style={styles.panelHeadline}>Fast, familiar sign-in</Text>
              <View style={styles.listBlock}>
                <Text style={styles.listItem}>• Posts to `/api/v1/auth/login`</Text>
                <Text style={styles.listItem}>• Stores the access and refresh tokens locally</Text>
                <Text style={styles.listItem}>• Redirects back to the home page after success</Text>
                <Text style={styles.listItem}>• Supports refresh and logout when a session already exists</Text>
              </View>

              <View style={styles.sessionNote}>
                <Text style={styles.sessionNoteLabel}>Seeded account</Text>
                <Text style={styles.sessionNoteValue}>admin@futureprime.com</Text>
              </View>
              <View style={styles.sessionNote}>
                <Text style={styles.sessionNoteLabel}>Default password</Text>
                <Text style={styles.sessionNoteValue}>Admin@1234</Text>
              </View>

              <Text accessibilityRole="text" style={styles.bodyText}>
                The login screen now matches the same Everest-inspired visual system as the home page.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.snow,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.snow,
  },
  container: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: spacing.xl,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    ...shadow,
  },
  brandMarkText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  brandName: {
    color: colors.slate,
    fontFamily: "Roboto",
    fontWeight: "700",
    fontSize: 16,
  },
  brandTagline: {
    color: colors.muted,
    fontFamily: "Roboto",
    fontSize: 11,
    marginTop: 1,
  },
  topNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  navButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  navButtonPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  navButtonLabel: {
    color: colors.muted,
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "500",
  },
  eyebrow: {
    color: colors.blueDeep,
    fontFamily: "Roboto",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  hero: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginBottom: spacing.xl,
  },
  authHero: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  heroColumn: {
    flexBasis: 460,
    flexGrow: 1,
    minWidth: 280,
    marginBottom: spacing.lg,
  },
  authColumn: {
    flexBasis: 460,
    flexGrow: 1,
    minWidth: 280,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    color: colors.slate,
    fontFamily: "Roboto",
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "700",
  },
  heroText: {
    color: colors.muted,
    fontFamily: "Roboto",
    fontSize: 16,
    lineHeight: 25,
    marginTop: spacing.md,
    maxWidth: 680,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.lg,
  },
  button: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  buttonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonCompact: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ translateY: 1 }],
  },
  buttonLabel: {
    color: "#fff",
    fontFamily: "Roboto",
    fontWeight: "500",
  },
  buttonLabelSecondary: {
    color: colors.slate,
  },
  buttonLabelGhost: {
    color: colors.muted,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.lg,
  },
  metricCard: {
    flexBasis: 170,
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  metricValue: {
    color: colors.blueDeep,
    fontFamily: "Roboto",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: "Roboto",
    fontSize: 13,
    lineHeight: 19,
  },
  sessionPanel: {
    backgroundColor: colors.ice,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginLeft: spacing.sm,
    ...shadow,
  },
  panelTitle: {
    color: colors.blueDeep,
    fontFamily: "Roboto",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  panelHeadline: {
    color: colors.slate,
    fontFamily: "Roboto",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  panelText: {
    color: colors.muted,
    fontFamily: "Roboto",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  statusText: {
    color: colors.blueDeep,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionAlt: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(215,226,239,0.8)",
    borderRadius: radius.xl,
    backgroundColor: "rgba(238,244,251,0.75)",
  },
  sectionHeading: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.slate,
    fontFamily: "Roboto",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    color: colors.muted,
    fontFamily: "Roboto",
    fontSize: 14,
    maxWidth: 760,
    lineHeight: 24,
  },
  controlsRow: {
    marginBottom: spacing.lg,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.slate,
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: {
    backgroundColor: "rgba(53,109,203,0.12)",
    borderColor: "rgba(53,109,203,0.18)",
  },
  chipLabel: {
    color: colors.muted,
    fontWeight: "700",
  },
  chipLabelActive: {
    color: colors.blueDeep,
  },
  chipLabelSuccess: {
    color: colors.success,
  },
  catalogGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  catalogCard: {
    flexBasis: 290,
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  catalogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  badgePrimary: {
    backgroundColor: "rgba(53,109,203,0.12)",
  },
  badgeSuccess: {
    backgroundColor: "rgba(21,128,61,0.12)",
  },
  badgeText: {
    color: colors.blueDeep,
    fontWeight: "800",
    fontSize: 12,
  },
  catalogTitle: {
    color: colors.slate,
    fontFamily: "Roboto",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  catalogPrice: {
    color: colors.slate,
    fontWeight: "800",
    fontSize: 14,
    textAlign: "right",
  },
  catalogDescription: {
    color: colors.muted,
    fontFamily: "Roboto",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: colors.ice,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagText: {
    color: colors.blueDeep,
    fontWeight: "700",
    fontSize: 12,
  },
  twoColumn: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoCard: {
    flexBasis: 420,
    flexGrow: 1,
    minWidth: 280,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  bodyText: {
    color: colors.muted,
    fontFamily: "Roboto",
    fontSize: 14,
    lineHeight: 22,
  },
  listBlock: {
    marginTop: spacing.md,
  },
  listItem: {
    color: colors.slate,
    fontFamily: "Roboto",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  contactBlock: {
    marginTop: spacing.lg,
  },
  contactLink: {
    color: colors.blueDeep,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  contactText: {
    color: colors.muted,
    lineHeight: 22,
  },
  footer: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  footerText: {
    color: colors.slate,
    fontWeight: "700",
  },
  footerTextMuted: {
    color: colors.muted,
  },
  formCard: {
    marginTop: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow,
  },
  inputLabel: {
    color: colors.slate,
    fontWeight: "800",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.slate,
  },
  sessionNote: {
    marginTop: spacing.md,
    backgroundColor: colors.ice,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  sessionNoteLabel: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  sessionNoteValue: {
    color: colors.slate,
    fontWeight: "800",
  },
});

export default App;
