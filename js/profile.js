/* =========================================================
   RETAILMIND AI
   PROFILE PAGE
   SUPABASE VERSION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("RetailMind Profile JS loaded.");
    /* =====================================================
       PROFILE TOAST NOTIFICATION
    ===================================================== */

    function showProfileToast(message, type = "success") {

        const oldToast =
            document.getElementById("profileToast");

        if (oldToast) {
            oldToast.remove();
        }

        const toast =
            document.createElement("div");

        toast.id = "profileToast";

        toast.innerHTML = `
        <div class="profile-toast-icon">
            <i class="fa-solid fa-check"></i>
        </div>

        <div class="profile-toast-content">
            <strong>Success</strong>
            <span>${message}</span>
        </div>

        <button
            class="profile-toast-close"
            type="button"
            aria-label="Close"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        const closeBtn =
            toast.querySelector(
                ".profile-toast-close"
            );

        closeBtn.addEventListener(
            "click",
            () => {

                toast.classList.remove("show");

                setTimeout(() => {
                    toast.remove();
                }, 300);

            }
        );

        setTimeout(() => {

            if (!document.body.contains(toast))
                return;

            toast.classList.remove("show");

            setTimeout(() => {
                toast.remove();
            }, 300);

        }, 3500);
    }
    /* =====================================================
       GET AUTHENTICATED USER
    ===================================================== */

    const {
        data: { session },
        error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) {
        console.error(
            "Profile session error:",
            sessionError
        );
        return;
    }

    if (!session || !session.user) {
        console.error("No authenticated user found.");
        return;
    }

    const user = session.user;

    console.log(
        "RetailMind authenticated user:",
        user
    );


    /* =====================================================
       GET PROFILE FROM SUPABASE
    ===================================================== */

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(`
            id,
            full_name,
            phone,
            avatar_url
        `)
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        console.error(
            "Profile loading error:",
            profileError
        );
        return;
    }

    console.log(
        "RetailMind Supabase profile:",
        profile
    );
    /* =====================================================
       GET USER'S BUSINESS
    ===================================================== */

    const {
        data: businessMember,
        error: businessMemberError
    } = await supabaseClient
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (businessMemberError) {
        console.error(
            "Business membership loading error:",
            businessMemberError
        );
        return;
    }

    if (!businessMember) {
        console.error(
            "No business found for this user."
        );
        return;
    }

    const businessId =
        businessMember.business_id;

    console.log(
        "RetailMind Business ID:",
        businessId
    );
    /* =====================================================
   GET USER BUSINESS ROLE
===================================================== */

    const {
        data: memberData,
        error: memberError
    } = await supabaseClient
        .from("business_members")
        .select("role")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (memberError) {
        console.error(
            "Business role loading error:",
            memberError
        );
        return;
    }

    const userRole =
        memberData?.role || "staff";

    console.log(
        "RetailMind User Role:",
        userRole
    );
    /* =====================================================
       GET BUSINESS DETAILS
    ===================================================== */

    const {
        data: business,
        error: businessError
    } = await supabaseClient
        .from("businesses")
        .select(`
        id,
        name,
        business_type,
        warehouse_name,
        warehouse_city,
        low_stock_alert_level,
        currency,
        gst_rate,
        language
    `)
        .eq("id", businessId)
        .single();

    if (businessError) {
        console.error(
            "Business loading error:",
            businessError
        );
        return;
    }

    console.log(
        "RetailMind Business:",
        business
    );
    /* =====================================================
       GET BUSINESS SETTINGS
    ===================================================== */

    const {
        data: businessSettings,
        error: businessSettingsError
    } = await supabaseClient
        .from("business_settings")
        .select(`
        business_id,
        address,
        gstin,
        date_format,
        language,
        currency,
        auto_backup
    `)
        .eq("business_id", businessId)
        .maybeSingle();

    if (businessSettingsError) {
        console.error(
            "Business settings loading error:",
            businessSettingsError
        );
        return;
    }

    console.log(
        "RetailMind Business Settings:",
        businessSettings
    );
    /* =====================================================
   DISPLAY BUSINESS DATA
===================================================== */

    const businessNameInput =
        document.getElementById("businessName");

    const businessTypeInput =
        document.getElementById("businessType");

    const gstinInput =
        document.getElementById("gstin");

    const currencyInput =
        document.getElementById("currency");

    const businessAddressInput =
        document.getElementById("businessAddress");


    /* =====================================================
       BUSINESS DETAILS
    ===================================================== */

    if (businessNameInput) {
        businessNameInput.value =
            business?.name || "";
    }

    if (businessTypeInput) {
        businessTypeInput.value =
            business?.business_type || "";
    }

    if (gstinInput) {
        gstinInput.value =
            businessSettings?.gstin || "";
    }

    if (currencyInput) {
        currencyInput.value =
            businessSettings?.currency ||
            business?.currency ||
            "INR";
    }

    if (businessAddressInput) {
        businessAddressInput.value =
            businessSettings?.address || "";
    }
    /* =====================================================
       FIND PROFILE ELEMENTS
    ===================================================== */

    const fullNameInput =
        document.querySelector(
            'input[type="text"]'
        );

    const emailInput =
        document.querySelector(
            'input[type="email"]'
        );

    const phoneInput =
        document.querySelector(
            'input[type="tel"]'
        );

    const profileName =
        document.querySelector(
            '.card h3'
        );
    const profileRole =
        document.getElementById("profileRole");
    const avatarElements =
        document.querySelectorAll(
            ".user-avatar-circle"
        );


    /* =====================================================
       DISPLAY SUPABASE DATA
    ===================================================== */

    // Full Name
    if (fullNameInput) {
        fullNameInput.value =
            profile?.full_name || "";
    }


    // Email
    if (emailInput) {
        emailInput.value =
            user.email || "";

        // Email belongs to Supabase Auth
        emailInput.readOnly = true;
    }


    // Phone
    if (phoneInput) {
        phoneInput.value =
            profile?.phone || "";
    }


    // Profile card name
    if (profileName) {
        profileName.textContent =
            profile?.full_name || "User";
    }

    if (profileRole) {

        const roleLabel = {
            owner: "Owner",
            admin: "Administrator",
            manager: "Manager",
            staff: "Staff"
        };

        profileRole.textContent =
            roleLabel[userRole] ||
            "Staff";

    }
    /* =====================================================
       DISPLAY PROFILE AVATAR
    ===================================================== */

    const name =
        profile?.full_name ||
        user.email ||
        "User";

    const initials =
        name
            .split(" ")
            .filter(Boolean)
            .map(word => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();


    avatarElements.forEach(avatar => {

        if (profile?.avatar_url) {

            avatar.innerHTML = `
                <img
                    src="${profile.avatar_url}"
                    alt="Profile Picture"
                    style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        border-radius: 50%;
                        display: block;
                    "
                >
            `;

        } else {

            avatar.textContent =
                initials;

        }

    });


    /* =====================================================
       PROFILE PHOTO PICKER
    ===================================================== */

    const changePhotoBtn =
        document.getElementById(
            "changePhotoBtn"
        );

    const profilePhotoInput =
        document.getElementById(
            "profilePhotoInput"
        );


    if (changePhotoBtn && profilePhotoInput) {

        changePhotoBtn.addEventListener(
            "click",
            () => {
                profilePhotoInput.click();
            }
        );


        /* =================================================
           PROFILE PHOTO UPLOAD
        ================================================= */

        profilePhotoInput.addEventListener(
            "change",
            async () => {

                const file =
                    profilePhotoInput.files[0];

                if (!file) return;


                console.log(
                    "Selected profile image:",
                    file.name
                );


                /* -----------------------------------------
                   CHECK FILE TYPE
                ----------------------------------------- */

                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                if (!allowedTypes.includes(file.type)) {

                    alert(
                        "Please select a JPG, PNG, or WebP image."
                    );

                    profilePhotoInput.value = "";

                    return;
                }


                /* -----------------------------------------
                   CHECK FILE SIZE
                   Maximum: 5 MB
                ----------------------------------------- */

                const maxSize =
                    5 * 1024 * 1024;

                if (file.size > maxSize) {

                    alert(
                        "Image size must be less than 5 MB."
                    );

                    profilePhotoInput.value = "";

                    return;
                }


                /* -----------------------------------------
                   CREATE UNIQUE FILE PATH
                ----------------------------------------- */

                const fileExt =
                    file.name
                        .split(".")
                        .pop()
                        .toLowerCase();

                const filePath =
                    `${user.id}/profile-${Date.now()}.${fileExt}`;


                /* -----------------------------------------
                   UPLOAD IMAGE
                ----------------------------------------- */

                const {
                    data,
                    error
                } = await supabaseClient.storage
                    .from("avatars")
                    .upload(
                        filePath,
                        file,
                        {
                            upsert: false,
                            contentType: file.type
                        }
                    );


                if (error) {

                    console.error(
                        "Avatar upload error:",
                        error
                    );

                    alert(
                        "Image upload failed. Check the console."
                    );

                    return;
                }


                console.log(
                    "Avatar uploaded successfully:",
                    data
                );


                /* -----------------------------------------
                   GET PUBLIC URL
                ----------------------------------------- */

                const {
                    data: publicUrlData
                } = supabaseClient.storage
                    .from("avatars")
                    .getPublicUrl(
                        filePath
                    );


                const avatarUrl =
                    publicUrlData.publicUrl;


                console.log(
                    "Avatar public URL:",
                    avatarUrl
                );


                /* -----------------------------------------
                   SAVE URL TO PROFILES TABLE
                ----------------------------------------- */

                const {
                    error: avatarUpdateError
                } = await supabaseClient
                    .from("profiles")
                    .update({
                        avatar_url: avatarUrl,
                        updated_at:
                            new Date().toISOString()
                    })
                    .eq(
                        "id",
                        user.id
                    );


                if (avatarUpdateError) {

                    console.error(
                        "Avatar URL update error:",
                        avatarUpdateError
                    );

                    alert(
                        "Image uploaded, but profile could not be updated."
                    );

                    return;
                }


                console.log(
                    "Avatar URL saved to profile successfully."
                );
                profile.avatar_url = avatarUrl;

                /* -----------------------------------------
                   DISPLAY NEW AVATAR IMMEDIATELY
                ----------------------------------------- */

                avatarElements.forEach(
                    avatar => {

                        avatar.innerHTML = `
                            <img
                                src="${avatarUrl}"
                                alt="Profile Picture"
                                style="
                                    width: 100%;
                                    height: 100%;
                                    object-fit: cover;
                                    border-radius: 50%;
                                    display: block;
                                "
                            >
                        `;

                    }
                );


                /* -----------------------------------------
                   RESET FILE INPUT
                ----------------------------------------- */

                profilePhotoInput.value = "";


                showProfileToast(
                    "Profile picture uploaded successfully!",
                    "success"
                );
            }
        );

    }


    /* =====================================================
       SAVE PROFILE
    ===================================================== */

    const form =
        document.querySelector("form");


    if (form) {

        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const updatedName =
                    fullNameInput
                        ? fullNameInput.value.trim()
                        : "";


                const updatedPhone =
                    phoneInput
                        ? phoneInput.value.trim()
                        : "";


                /* -----------------------------------------
                   VALIDATE NAME
                ----------------------------------------- */

                if (!updatedName) {

                    alert(
                        "Please enter your full name."
                    );

                    return;
                }


                /* -----------------------------------------
                   UPDATE PROFILE
                ----------------------------------------- */

                const {
                    error: updateError
                } = await supabaseClient
                    .from("profiles")
                    .update({
                        full_name:
                            updatedName,

                        phone:
                            updatedPhone || null,

                        updated_at:
                            new Date().toISOString()
                    })
                    .eq(
                        "id",
                        user.id
                    );


                if (updateError) {

                    console.error(
                        "Profile update error:",
                        updateError
                    );

                    alert(
                        "Unable to save profile. Check the console."
                    );

                    return;
                }
                /* =====================================================
                   UPDATE BUSINESS DETAILS
                ===================================================== */

                const updatedBusinessName =
                    document.getElementById("businessName")?.value.trim() || "";

                const updatedBusinessType =
                    document.getElementById("businessType")?.value || "Retail";

                const updatedGSTIN =
                    document.getElementById("gstin")?.value.trim() || "";

                const updatedCurrency =
                    document.getElementById("currency")?.value || "INR";

                const updatedAddress =
                    document.getElementById("businessAddress")?.value.trim() || "";


                /* =====================================================
                   SAVE BUSINESS
                ===================================================== */

                const {
                    error: businessUpdateError
                } = await supabaseClient
                    .from("businesses")
                    .update({
                        name: updatedBusinessName,
                        business_type: updatedBusinessType,
                        currency: updatedCurrency
                    })
                    .eq("id", businessId);

                if (businessUpdateError) {

                    console.error(
                        "Business update error:",
                        businessUpdateError
                    );

                    alert(
                        "Profile saved, but business details could not be updated."
                    );

                    return;
                }


                /* =====================================================
                   SAVE BUSINESS SETTINGS
                ===================================================== */

                const {
                    error: settingsUpdateError
                } = await supabaseClient
                    .from("business_settings")
                    .update({
                        gstin: updatedGSTIN || null,
                        address: updatedAddress || null,
                        currency: updatedCurrency,
                        updated_at: new Date().toISOString()
                    })
                    .eq("business_id", businessId);

                if (settingsUpdateError) {

                    console.error(
                        "Business settings update error:",
                        settingsUpdateError
                    );

                    alert(
                        "Business details could not be saved."
                    );

                    return;
                }

                console.log(
                    "Business details updated successfully."
                );

                /* -----------------------------------------
                   UPDATE VISIBLE PROFILE NAME
                ----------------------------------------- */

                if (profileName) {

                    profileName.textContent =
                        updatedName;

                }


                /* -----------------------------------------
                   UPDATE INITIALS
                   ONLY IF THERE IS NO PROFILE IMAGE
                ----------------------------------------- */

                if (!profile?.avatar_url) {

                    const newInitials =
                        updatedName
                            .split(" ")
                            .filter(Boolean)
                            .map(
                                word => word[0]
                            )
                            .join("")
                            .substring(
                                0,
                                2
                            )
                            .toUpperCase();


                    avatarElements.forEach(
                        avatar => {

                            avatar.textContent =
                                newInitials;

                        }
                    );

                }


                console.log(
                    "Profile updated successfully."
                );


                alert(
                    "Profile changes saved successfully."
                );

            }
        );

    }

});