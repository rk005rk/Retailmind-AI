
/* =========================================
   RetailMind AI — Setup Wizard + Supabase
========================================= */

(() => {
  const db = () => window.supabaseClient || window.db;

  const $ = (id) => document.getElementById(id);

  let currentStep = 1;
  const totalSteps = 6;

  let currentUser = null;
  let currentBusinessId = null;
  let currentBusiness = null;
  let saving = false;

  const categoryCards = () =>
    [...document.querySelectorAll("#paneStep2 .choice-card")];

  function showMessage(message, type = "info") {
    const element = $("setupMessage");
    if (!element) return;

    const colors = {
      info: "#475569",
      success: "#047857",
      error: "#B91C1C"
    };

    element.textContent = message;
    element.style.color = colors[type] || colors.info;
  }

  function setValue(id, value) {
    const element = $(id);
    if (element && value !== null && value !== undefined) {
      element.value = value;
    }
  }

  function renderStep(step) {
    currentStep = Math.max(1, Math.min(totalSteps, step));

    for (let i = 1; i <= totalSteps; i++) {
      $("paneStep" + i)?.classList.toggle("active", i === currentStep);

      const indicator = $("stepIndicator" + i);
      if (indicator) {
        indicator.classList.toggle("active", i === currentStep);
        indicator.classList.toggle("completed", i < currentStep);
      }
    }

    if ($("currentStepNum")) {
      $("currentStepNum").textContent = currentStep;
    }

    if ($("btnWizardPrev")) {
      $("btnWizardPrev").style.display =
        currentStep > 1 && currentStep < totalSteps
          ? "inline-flex"
          : "none";
    }

    if ($("btnWizardNext")) {
      $("btnWizardNext").innerHTML =
        currentStep === 5
          ? 'Save Setup <i class="fa-solid fa-arrow-right"></i>'
          : 'Next Step <i class="fa-solid fa-arrow-right"></i>';
    }

    if ($("wizardControls")) {
      $("wizardControls").style.display =
        currentStep === totalSteps ? "none" : "flex";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateCurrentStep() {
    const pane = $("paneStep" + currentStep);
    if (!pane) return true;

    for (const field of pane.querySelectorAll("input, select, textarea")) {
      if (field.disabled || field.type === "hidden") continue;

      if (!field.checkValidity()) {
        field.reportValidity();
        field.focus();
        return false;
      }
    }

    if (currentStep === 1) {
      const name = $("businessName")?.value.trim();
      const type = $("businessType")?.value;

      if (!name || !type) {
        showMessage("Enter your business name and select a retail segment.", "error");
        return false;
      }

      const gstin = $("businessGstin")?.value.trim();
      if (gstin && !/^[0-9A-Z]{15}$/.test(gstin)) {
        showMessage("Check the GSTIN format. It should contain 15 letters/numbers.", "error");
        $("businessGstin")?.focus();
        return false;
      }
    }

    return true;
  }

  function getSelectedCategories() {
    return categoryCards()
      .filter(card => card.classList.contains("selected"))
      .map(card => card.querySelector(".font-bold")?.textContent.trim())
      .filter(Boolean);
  }

  function getPreferences() {
    return {
      categories: getSelectedCategories(),
      safety_stock_rule: $("safetyStockRule")?.value || "",
      dead_stock_rule: $("deadStockRule")?.value || "",
      auto_purchase_order: $("autoPoCheck")?.checked ?? false,
      wizard_version: 1
    };
  }

  function loadPreferences(preferences = {}) {
    const selected = new Set(preferences.categories || []);

    categoryCards().forEach(card => {
      const label = card.querySelector(".font-bold")?.textContent.trim();
      const isSelected = selected.size
        ? selected.has(label)
        : card.classList.contains("selected");

      card.classList.toggle("selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });

    setValue("safetyStockRule", preferences.safety_stock_rule);
    setValue("deadStockRule", preferences.dead_stock_rule);

    if (typeof preferences.auto_purchase_order === "boolean" && $("autoPoCheck")) {
      $("autoPoCheck").checked = preferences.auto_purchase_order;
    }
  }

  async function loadSetup() {
    const client = db();

    if (!client) {
      showMessage("Supabase client not found. Check js/supabase.js.", "error");
      return;
    }

    showMessage("Loading your business settings...");

    try {
      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

      if (sessionError) throw sessionError;

      currentUser = sessionData?.session?.user;

      if (!currentUser) {
        showMessage("Your session has expired. Please log in again.", "error");
        return;
      }

      const { data: membership, error: membershipError } = await client
        .from("business_members")
        .select(`
          business_id,
          role,
          businesses (
            id,
            name,
            business_type,
            warehouse_name,
            warehouse_city,
            currency,
            gst_rate,
            gstin,
            address,
            setup_preferences,
            onboarding_completed
          )
        `)
        .eq("user_id", currentUser.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;

      if (!membership?.business_id || !membership.businesses) {
        showMessage(
          "No business is linked to this account yet. Create or link a business first.",
          "error"
        );
        return;
      }

      currentBusinessId = membership.business_id;
      currentBusiness = membership.businesses;

      window.currentBusinessId = currentBusinessId;
      window.currentBusiness = currentBusiness;

      setValue("businessName", currentBusiness.name);
      setValue("businessType", currentBusiness.business_type);
      setValue("businessGstin", currentBusiness.gstin);
      setValue("businessAddress", currentBusiness.address);

      loadPreferences(currentBusiness.setup_preferences || {});

      showMessage(
        currentBusiness.onboarding_completed
          ? "Your saved setup is loaded. You can update it here."
          : "Your business is linked. Complete the steps and save your setup.",
        "success"
      );
    } catch (error) {
      console.error("Setup load failed:", error);
      showMessage(
        "Unable to load setup: " + (error.message || "Check Supabase permissions and schema."),
        "error"
      );
    }
  }

  async function saveSetup() {
    const client = db();

    if (saving) return false;

    if (!client || !currentUser || !currentBusinessId) {
      showMessage("A signed-in user and linked business are required before saving.", "error");
      return false;
    }

    saving = true;

    if ($("btnWizardNext")) {
      $("btnWizardNext").disabled = true;
      $("btnWizardNext").textContent = "Saving...";
    }

    showMessage("Saving your business setup...");

    try {
      const profile = {
        name: $("businessName").value.trim(),
        business_type: $("businessType").value,
        gstin: $("businessGstin").value.trim() || null,
        address: $("businessAddress").value.trim() || null,
        setup_preferences: getPreferences(),
        onboarding_completed: true
      };

      // Update only the existing business linked to the signed-in user.
      const { data, error } = await client
        .from("businesses")
        .update(profile)
        .eq("id", currentBusinessId)
        .select("id, name, business_type, gstin, address, setup_preferences, onboarding_completed")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "No business was updated. Check business membership and Row Level Security policies."
        );
      }

      currentBusiness = { ...currentBusiness, ...data };
      window.currentBusiness = currentBusiness;

      showMessage("Business profile and setup preferences saved successfully.", "success");

      return true;
    } catch (error) {
      console.error("Setup save failed:", error);
      showMessage(
        "Save failed: " + (error.message || "Unknown error"),
        "error"
      );
      return false;
    } finally {
      saving = false;

      if ($("btnWizardNext")) {
        $("btnWizardNext").disabled = false;
        $("btnWizardNext").innerHTML =
          'Save Setup <i class="fa-solid fa-arrow-right"></i>';
      }
    }
  }

  window.navigateWizard = async function (direction) {
    if (saving) return;

    if (direction < 0) {
      renderStep(currentStep - 1);
      return;
    }

    if (!validateCurrentStep()) return;

    if (currentStep < 5) {
      renderStep(currentStep + 1);
      return;
    }

    // Step 5 saves the profile and preferences before completion.
    if (currentStep === 5) {
      const saved = await saveSetup();
      if (!saved) return;

      renderStep(6);
      showMessage("Setup saved. Review the completion screen before opening the Dashboard.", "success");
    }
  };

  // Make category choices keyboard-accessible.
  categoryCards().forEach(card => {
    card.removeAttribute("onclick");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    const toggle = () => {
      const selected = card.classList.toggle("selected");
      card.setAttribute("aria-pressed", String(selected));
    };

    card.addEventListener("click", toggle);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  // Complete onboarding only after successful save.
  document.querySelector("#paneStep6 button")?.addEventListener("click", () => {
    if (!currentBusiness?.onboarding_completed) {
      showMessage("Save your setup successfully before launching the Dashboard.", "error");
      return;
    }

    window.location.href = "dashboard.html";
  });

  // Save-and-exit keeps onboarding incomplete if not yet saved.
  document.querySelector(".wizard-navbar .btn-ghost")?.addEventListener("click", event => {
    event.preventDefault();
    window.location.href = "dashboard.html";
  });

  document.addEventListener("DOMContentLoaded", loadSetup);
})();
