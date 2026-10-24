
/* =========================================================
   RetailMind AI — Notifications
   Matches the existing Supabase notifications schema:
   id, business_id, user_id, type, title, description,
   is_read, read_at, created_at
========================================================= */

(() => {
    "use strict";

    const state = {
        client: null,
        user: null,
        businessId: null,
        notifications: [],
        activeCategory: "all",
        search: "",
        readFilter: "all",
        sort: "newest",
        loading: false
    };

    const $ = (id) => document.getElementById(id);

    function getSupabaseClient() {
        return (
            window.supabaseClient ||
            window.db ||
            window.supabase ||
            null
        );
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function showStatus(message, isError = false) {
        const element = $("notificationStatus");
        if (!element) return;

        element.textContent = message;
        element.style.color = isError ? "#dc2626" : "#64748b";
    }

    function normalizeType(type) {
        const value = String(type || "system").toLowerCase();

        if (["inventory", "stock", "product"].includes(value)) {
            return "inventory";
        }

        if (["sale", "sales", "revenue", "order"].includes(value)) {
            return "sales";
        }

        if (["ai", "insight", "analytics"].includes(value)) {
            return "ai";
        }

        return "system";
    }

    function formatDate(value) {
        if (!value) return "Recently";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Recently";

        return date.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short"
        });
    }

    function iconFor(type) {
        const icons = {
            inventory: "📦",
            sales: "📈",
            ai: "✨",
            system: "🔔"
        };

        return icons[normalizeType(type)];
    }

    async function generateLowStockNotifications() {
        if (!state.client || !state.businessId) {
            return;
        }

        try {
            const { data, error } = await state.client.rpc(
                "generate_low_stock_notifications",
                {
                    p_business_id: state.businessId
                }
            );

            if (error) {
                throw error;
            }

            console.log(
                "Low-stock notification generation completed.",
                data
            );
        } catch (error) {
            console.error(
                "Could not generate low-stock notifications:",
                error.message
            );

            showStatus(
                "Could not generate inventory alerts: " + error.message,
                true
            );
        }
    }

    async function initialize() {
        state.client = getSupabaseClient();

        if (!state.client || typeof state.client.from !== "function") {
            showStatus(
                "Supabase client not found. Check js/supabase.js.",
                true
            );
            return;
        }

        try {
            const { data, error } = await state.client.auth.getUser();

            if (error) throw error;

            state.user = data?.user;

            if (!state.user) {
                showStatus("Please log in to view your notifications.", true);
                return;
            }


            await loadBusinessId();
            bindEvents();

            await generateLowStockNotifications();
            await loadNotifications();

        } catch (error) {
            console.error("Notification initialization failed:", error);
            showStatus(error.message || "Unable to initialize notifications.", true);
        }
    }

    async function loadBusinessId() {
        const { data, error } = await state.client
            .from("business_members")
            .select("business_id")
            .eq("user_id", state.user.id);

        if (error) throw error;

        if (!data?.length) {
            throw new Error(
                "No business membership found for the logged-in user."
            );
        }

        // If the user belongs to multiple businesses, use the first
        // membership until a business switcher is implemented.
        state.businessId = data[0].business_id;
    }

    function bindEvents() {
        $("btnRefreshNotifications")?.addEventListener("click", loadNotifications);

        $("notificationSearch")?.addEventListener("input", (event) => {
            state.search = event.target.value.trim().toLowerCase();
            renderNotifications();
        });

        $("notificationReadFilter")?.addEventListener("change", (event) => {
            state.readFilter = event.target.value;
            renderNotifications();
        });

        $("notificationSort")?.addEventListener("change", (event) => {
            state.sort = event.target.value;
            renderNotifications();
        });

        document.querySelectorAll("[data-category]").forEach((button) => {
            button.addEventListener("click", () => {
                state.activeCategory = button.dataset.category || "all";

                document.querySelectorAll("[data-category]").forEach((item) => {
                    item.classList.remove("active");
                });

                button.classList.add("active");
                renderNotifications();
            });
        });

        $("btnMarkAllRead")?.addEventListener("click", markAllRead);
        $("btnClearReadNotifications")?.addEventListener("click", deleteReadNotifications);

        // Delegated click handler for dynamically rendered notification buttons.
        $("fullNotifsList")?.addEventListener("click", handleListClick);
    }

    async function loadNotifications() {
        if (state.loading || !state.businessId) return;

        state.loading = true;
        showStatus("Loading notifications...");

        try {
            const { data, error } = await state.client
                .from("notifications")
                .select("id, business_id, user_id, type, title, description, is_read, read_at, created_at")
                .eq("business_id", state.businessId)
                .order("created_at", { ascending: false })
                .limit(500);

            if (error) throw error;

            // Show notifications assigned to this user or shared with
            // all members (user_id is null).
            state.notifications = (data || []).filter(
                (notification) =>
                    !notification.user_id ||
                    notification.user_id === state.user.id
            );

            renderNotifications();
            showStatus(
                state.notifications.length
                    ? "Notifications loaded successfully."
                    : "No notifications found for this business."
            );
        } catch (error) {
            console.error("Failed to load notifications:", error);
            showStatus(
                error.message || "Failed to load notifications.",
                true
            );
        } finally {
            state.loading = false;
        }
    }

    function getFilteredNotifications() {
        let items = [...state.notifications];

        if (state.activeCategory !== "all") {
            items = items.filter(
                (item) => normalizeType(item.type) === state.activeCategory
            );
        }

        if (state.search) {
            items = items.filter((item) => {
                const searchable = [
                    item.title,
                    item.description,
                    item.type
                ].join(" ").toLowerCase();

                return searchable.includes(state.search);
            });
        }

        if (state.readFilter === "unread") {
            items = items.filter((item) => !item.is_read);
        } else if (state.readFilter === "read") {
            items = items.filter((item) => item.is_read);
        }

        items.sort((a, b) => {
            const first = new Date(a.created_at || 0).getTime();
            const second = new Date(b.created_at || 0).getTime();

            return state.sort === "oldest"
                ? first - second
                : second - first;
        });

        return items;
    }

    function renderNotifications() {
        updateCounters();

        const container = $("fullNotifsList");
        if (!container) return;

        const items = getFilteredNotifications();

        if (!items.length) {
            container.innerHTML = `
        <div class="notification-empty" style="padding:32px;text-align:center;">
          <div style="font-size:32px;margin-bottom:10px;">🔔</div>
          <h3>No notifications found</h3>
          <p style="color:#64748b;">
            New business notifications will appear here.
          </p>
        </div>
      `;

            updateResultCount(0);
            return;
        }

        container.innerHTML = items.map((item) => {
            const type = normalizeType(item.type);

            return `
        <article
          class="notification-item ${item.is_read ? "" : "unread"}"
          data-id="${escapeHTML(item.id)}"
          style="display:flex;gap:14px;padding:18px;border-bottom:1px solid #e5e7eb;"
        >
          <div style="font-size:24px;" aria-hidden="true">
            ${iconFor(type)}
          </div>

          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <strong>${escapeHTML(item.title)}</strong>
              ${!item.is_read
                    ? '<span style="font-size:11px;color:#2563eb;">NEW</span>'
                    : ""}
            </div>

            <p style="margin:7px 0;color:#64748b;">
              ${escapeHTML(item.description)}
            </p>

            <small style="color:#94a3b8;">
              ${escapeHTML(type)} · ${escapeHTML(formatDate(item.created_at))}
            </small>
          </div>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            ${!item.is_read
                    ? `<button type="button" data-action="read" data-id="${escapeHTML(item.id)}">✓ Mark read</button>`
                    : ""}
          </div>
        </article>
      `;
        }).join("");

        updateResultCount(items.length);
    }

    function updateCounters() {
        const all = state.notifications.length;
        const unread = state.notifications.filter((item) => !item.is_read).length;
        const read = all - unread;

        const critical = state.notifications.filter((item) =>
            !item.is_read &&
            ["critical", "high"].includes(String(item.priority || "").toLowerCase())
        ).length;

        if ($("totalNotificationCount")) {
            $("totalNotificationCount").textContent = all;
        }

        if ($("unreadNotificationCount")) {
            $("unreadNotificationCount").textContent = unread;
        }

        if ($("criticalNotificationCount")) {
            $("criticalNotificationCount").textContent = critical;
        }

        if ($("countAll")) $("countAll").textContent = all;
        if ($("countInventory")) {
            $("countInventory").textContent = state.notifications.filter(
                (item) => normalizeType(item.type) === "inventory"
            ).length;
        }

        if ($("countSales")) {
            $("countSales").textContent = state.notifications.filter(
                (item) => normalizeType(item.type) === "sales"
            ).length;
        }

        if ($("countAI")) {
            $("countAI").textContent = state.notifications.filter(
                (item) => normalizeType(item.type) === "ai"
            ).length;
        }

        if ($("countSystem")) {
            $("countSystem").textContent = state.notifications.filter(
                (item) => normalizeType(item.type) === "system"
            ).length;
        }

        const badge = $("sidebarNotificationBadge");
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread ? "" : "none";
        }

        // Keep the local read count available for future UI enhancements.
        void read;
    }

    function updateResultCount(count) {
        const element = $("notificationResultCount");
        if (element) {
            element.textContent = `${count} notification${count === 1 ? "" : "s"}`;
        }
    }

    async function handleListClick(event) {
        const button = event.target.closest("[data-action='read']");
        if (!button) return;

        await markOneRead(button.dataset.id);
    }

    async function markOneRead(id) {
        try {
            const { error } = await state.client
                .from("notifications")
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq("id", id)
                .eq("business_id", state.businessId);

            if (error) throw error;

            const notification = state.notifications.find((item) => item.id === id);

            if (notification) {
                notification.is_read = true;
                notification.read_at = new Date().toISOString();
            }

            renderNotifications();
            showStatus("Notification marked as read.");
        } catch (error) {
            console.error("Could not mark notification as read:", error);
            showStatus(error.message || "Unable to update notification.", true);
        }
    }

    async function markAllRead() {
        try {
            const { error } = await state.client
                .from("notifications")
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq("business_id", state.businessId)
                .eq("is_read", false);

            if (error) throw error;

            state.notifications.forEach((item) => {
                item.is_read = true;
                item.read_at = item.read_at || new Date().toISOString();
            });

            renderNotifications();
            showStatus("All notifications marked as read.");
        } catch (error) {
            console.error("Could not mark all notifications as read:", error);
            showStatus(error.message || "Unable to mark notifications as read.", true);
        }
    }

    async function deleteReadNotifications() {
        const confirmed = window.confirm(
            "Delete all read notifications for this business? This cannot be undone."
        );

        if (!confirmed) return;

        try {
            const { error } = await state.client
                .from("notifications")
                .delete()
                .eq("business_id", state.businessId)
                .eq("is_read", true);

            if (error) throw error;

            state.notifications = state.notifications.filter(
                (item) => !item.is_read
            );

            renderNotifications();
            showStatus("Read notifications deleted.");
        } catch (error) {
            console.error("Could not delete read notifications:", error);
            showStatus(error.message || "Unable to delete notifications.", true);
        }
    }

    // Backwards-compatible public functions for existing HTML.
    window.refreshNotifications = loadNotifications;
    window.markAllNotificationsRead = markAllRead;

    window.filterNotifs = (category, button) => {
        state.activeCategory = category || "all";

        document.querySelectorAll("[data-category]").forEach((item) => {
            item.classList.toggle("active", item === button);
        });

        renderNotifications();
    };

    window.RetailMindNotifications = {
        refresh: loadNotifications,
        markAllRead,
        getNotifications: () => [...state.notifications]
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
