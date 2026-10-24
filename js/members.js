/* =========================================================
   RETAILMIND AI
   BUSINESS MEMBERS
   SUPABASE + SEARCH + SUMMARY CARDS
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    const status = document.getElementById("membersStatus");
    const tableBody = document.getElementById("membersTableBody");
    const searchInput = document.getElementById("memberSearch");

    const totalMembersElement = document.getElementById("totalMembers");
    const ownerCountElement = document.getElementById("ownerCount");
    const otherRolesElement = document.getElementById("otherRolesCount");

    // Invite Member modal controls
    const inviteButton = document.getElementById("inviteMemberBtn");
    const inviteModal = document.getElementById("inviteMemberModal");
    const closeInviteButton = document.getElementById("closeInviteModal");
    const cancelInviteButton = document.getElementById("cancelInviteModal");
    const inviteForm = document.getElementById("inviteMemberForm");

    function openInviteModal() {
        inviteModal?.classList.add("show");
        document.getElementById("inviteEmail")?.focus();
    }

    function closeInviteModal() {
        inviteModal?.classList.remove("show");
        inviteForm?.reset();
    }

    inviteButton?.addEventListener("click", openInviteModal);
    closeInviteButton?.addEventListener("click", closeInviteModal);
    cancelInviteButton?.addEventListener("click", closeInviteModal);

    // Close when clicking the dark overlay
    inviteModal?.addEventListener("click", (event) => {
        if (event.target === inviteModal) {
            closeInviteModal();
        }
    });

    // Close with the Escape key
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && inviteModal?.classList.contains("show")) {
            closeInviteModal();
        }
    });

    // Prevent accidental form submission for now
    inviteForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        alert(
            "Invitation sending is not connected yet. No invitation was sent."
        );
    });

    let allMembers = [];

    if (!status || !tableBody) {
        console.error("Members page elements not found.");
        return;
    }

    status.textContent = "Loading members...";

    try {
        // 1. Check Supabase client
        if (typeof supabaseClient === "undefined") {
            throw new Error("Supabase client is unavailable.");
        }

        // 2. Check authentication
        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user) {
            status.textContent = "Please log in to view business members.";
            tableBody.innerHTML = "";
            return;
        }

        // 3. Fetch members using the secure database function
        const {
            data: members,
            error: membersError
        } = await supabaseClient.rpc("get_business_members");

        if (membersError) throw membersError;

        allMembers = members || [];

        // 4. Update summary cards
        if (totalMembersElement) {
            totalMembersElement.textContent = allMembers.length;
        }

        const ownerCount = allMembers.filter(
            member => String(member.role || "").toLowerCase() === "owner"
        ).length;

        const otherRolesCount = allMembers.length - ownerCount;

        if (ownerCountElement) {
            ownerCountElement.textContent = ownerCount;
        }

        if (otherRolesElement) {
            otherRolesElement.textContent = otherRolesCount;
        }

        // 5. Render member rows
        function renderMembers(searchTerm = "") {
            const term = searchTerm.trim().toLowerCase();

            const filteredMembers = allMembers.filter(member => {
                const name = member.full_name || "";
                const email = member.email || "";
                const role = member.role || "";

                return (
                    name.toLowerCase().includes(term) ||
                    email.toLowerCase().includes(term) ||
                    role.toLowerCase().includes(term)
                );
            });

            if (filteredMembers.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="members-empty">
                            <i class="fa-solid fa-magnifying-glass"
                               style="display:block; font-size:1.5rem; margin-bottom:0.75rem;">
                            </i>
                            No members match your search.
                        </td>
                    </tr>
                `;

                status.textContent = term
                    ? "No matching members found."
                    : "No business members found.";

                return;
            }

            tableBody.innerHTML = filteredMembers.map(member => {
                const name = member.full_name || "Unnamed member";
                const email = member.email || "—";
                const rawRole = String(member.role || "staff").toLowerCase();

                const roleLabels = {
                    owner: "Owner",
                    admin: "Administrator",
                    manager: "Manager",
                    staff: "Staff"
                };

                const role = roleLabels[rawRole] || rawRole;

                const initials = name
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .map(word => word[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase() || "U";

                const roleIcon = rawRole === "owner"
                    ? "fa-crown"
                    : rawRole === "admin"
                        ? "fa-user-shield"
                        : "fa-user";

                return `
                    <tr>
                        <td>
                            <div class="member-name-cell">
                                <div class="member-avatar">
                                    ${escapeHTML(initials)}
                                </div>
                                <span class="member-name">
                                    ${escapeHTML(name)}
                                </span>
                            </div>
                        </td>

                        <td>
                            <span class="member-email">
                                ${escapeHTML(email)}
                            </span>
                        </td>

                        <td>
                            <span class="member-role">
                                <i class="fa-solid ${roleIcon}"></i>
                                ${escapeHTML(role)}
                            </span>
                        </td>
                    </tr>
                `;
            }).join("");

            status.textContent = term
                ? `${filteredMembers.length} matching member(s) found.`
                : `${allMembers.length} member(s) found.`;
        }

        // 6. Search as the user types
        if (searchInput) {
            searchInput.addEventListener("input", () => {
                renderMembers(searchInput.value);
            });
        }

        // Initial display
        renderMembers();

        console.log("RetailMind business members loaded:", allMembers);

    } catch (error) {
        console.error("Business members loading error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="members-empty">
                    Unable to load members. Check the browser console.
                </td>
            </tr>
        `;

        status.textContent =
            error.message || "Unable to load business members.";
    }
});


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}