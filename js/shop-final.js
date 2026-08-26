// =====================================================
// Mahmud Telecom V8
// Suppliers Module
// Fixed Version
// =====================================================

"use strict";

// ======================================
// Local Storage
// ======================================

let suppliers = (() => {
    try {
        const raw = JSON.parse(localStorage.getItem("suppliers") || "[]");

        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray(raw.data)) return raw.data;
        if (raw && Array.isArray(raw.items)) return raw.items;
        if (raw && Array.isArray(raw.list)) return raw.list;

    } catch (e) {
        console.error("Supplier data read error:", e);
    }

    return [];
})();

let editIndex = -1;

// ======================================
// Elements
// ======================================

const supplierForm =
    document.getElementById("supplierForm");

const supplierTableBody =
    document.getElementById("supplierTableBody");

const totalSuppliers =
    document.getElementById("totalSuppliers");

const searchSupplier =
    document.getElementById("searchSupplier");

// ======================================
// Save Suppliers
// ======================================

function saveSuppliers() {

    try {

        localStorage.setItem(
            "suppliers",
            JSON.stringify(suppliers)
        );

    } catch (e) {

        console.error("Supplier save error:", e);

        alert("❌ Supplier সংরক্ষণ করা যায়নি।");

    }
}

// ======================================
// Load Suppliers
// ======================================

function loadSuppliers(keyword = "") {

    if (!supplierTableBody) return;

    supplierTableBody.innerHTML = "";

    keyword = String(keyword || "")
        .toLowerCase()
        .trim();

    const list = suppliers.filter(item => {

        const company =
            String(
                item?.company ??
                item?.companyName ??
                ""
            ).toLowerCase();

        const name =
            String(
                item?.name ??
                item?.contactPerson ??
                item?.supplierName ??
                ""
            ).toLowerCase();

        const mobile =
            String(
                item?.mobile ??
                item?.phone ??
                ""
            );

        return (
            company.includes(keyword) ||
            name.includes(keyword) ||
            mobile.includes(keyword)
        );

    });

    // ==================================
    // No Supplier
    // ==================================

    if (list.length === 0) {

        supplierTableBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                style="
                    text-align:center;
                    padding:25px;
                    color:#777;
                "
            >
                কোনো Supplier পাওয়া যায়নি
            </td>

        </tr>

        `;

        if (totalSuppliers) {
            totalSuppliers.textContent = "Total: 0";
        }

        return;
    }

    // ==================================
    // Supplier Rows
    // ==================================

    list.forEach((supplier) => {

        const realIndex =
            suppliers.indexOf(supplier);

        supplierTableBody.innerHTML += `

        <tr>

            <td>
                ${realIndex + 1}
            </td>

            <td>
                ${escapeHTML(
                    supplier.company ??
                    supplier.companyName ??
                    ""
                )}
            </td>

            <td>
                ${escapeHTML(
                    supplier.name ??
                    supplier.contactPerson ??
                    supplier.supplierName ??
                    ""
                )}
            </td>

            <td>
                ${escapeHTML(
                    supplier.mobile ??
                    supplier.phone ??
                    ""
                )}
            </td>

            <td>
                ৳ ${Number(
                    supplier.due || 0
                ).toLocaleString("bn-BD")}
            </td>

            <td>

                <button
                    class="btn-edit"
                    type="button"
                    onclick="editSupplier(${realIndex})"
                    title="Edit Supplier"
                >
                    ✏️
                </button>

                <button
                    class="btn-delete"
                    type="button"
                    onclick="deleteSupplier(${realIndex})"
                    title="Delete Supplier"
                >
                    🗑️
                </button>

            </td>

        </tr>

        `;

    });

    if (totalSuppliers) {

        totalSuppliers.textContent =
            "Total: " + list.length;

    }
}

// ======================================
// HTML Escape
// ======================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ======================================
// Add / Update Supplier
// ======================================

if (supplierForm) {

    supplierForm.addEventListener(
        "submit",
        function (e) {

            e.preventDefault();

            const companyInput =
                document.getElementById(
                    "supplierCompany"
                );

            const nameInput =
                document.getElementById(
                    "supplierName"
                );

            const mobileInput =
                document.getElementById(
                    "supplierMobile"
                );

            const emailInput =
                document.getElementById(
                    "supplierEmail"
                );

            const addressInput =
                document.getElementById(
                    "supplierAddress"
                );

            const dueInput =
                document.getElementById(
                    "supplierDue"
                );

            const noteInput =
                document.getElementById(
                    "supplierNote"
                );

            // ==========================
            // Check Elements
            // ==========================

            if (
                !companyInput ||
                !nameInput ||
                !mobileInput
            ) {

                alert(
                    "❌ Supplier form-এর প্রয়োজনীয় field পাওয়া যায়নি।"
                );

                return;
            }

            // ==========================
            // Supplier Object
            // ==========================

            const supplier = {

                company:
                    companyInput.value
                        .trim(),

                name:
                    nameInput.value
                        .trim(),

                mobile:
                    mobileInput.value
                        .trim(),

                email:
                    emailInput
                        ? emailInput.value.trim()
                        : "",

                address:
                    addressInput
                        ? addressInput.value.trim()
                        : "",

                due:
                    dueInput
                        ? Number(
                            dueInput.value
                        ) || 0
                        : 0,

                note:
                    noteInput
                        ? noteInput.value.trim()
                        : "",

                createdAt:
                    new Date()
                        .toLocaleString()

            };

            // ==========================
            // Required Check
            // ==========================

            if (
                supplier.company === "" ||
                supplier.name === "" ||
                supplier.mobile === ""
            ) {

                alert(
                    "⚠️ Company, Contact Person এবং Mobile লিখুন"
                );

                return;
            }

            // ==========================
            // Duplicate Mobile Check
            // ==========================

            const duplicate =
                suppliers.find(
                    (item, index) => {

                        const oldMobile =
                            String(
                                item?.mobile ??
                                item?.phone ??
                                ""
                            ).trim();

                        return (
                            oldMobile ===
                            supplier.mobile &&
                            index !== editIndex
                        );

                    }
                );

            if (duplicate) {

                alert(
                    "❌ এই মোবাইল নম্বর ইতিমধ্যে ব্যবহার করা হয়েছে"
                );

                return;
            }

            // ==========================
            // Add / Update
            // ==========================

            if (editIndex === -1) {

                suppliers.push(
                    supplier
                );

                alert(
                    "✅ Supplier Successfully Added"
                );

            } else {

                suppliers[editIndex] =
                    supplier;

                alert(
                    "✅ Supplier Successfully Updated"
                );

                editIndex = -1;
            }

            // ==========================
            // Save + Reload
            // ==========================

            saveSuppliers();

            loadSuppliers();

            // ==========================
            // Reset Form
            // ==========================

            supplierForm.reset();

            if (dueInput) {
                dueInput.value = 0;
            }

        }
    );

}

// ======================================
// Edit Supplier
// ======================================

function editSupplier(index) {

    const supplier =
        suppliers[index];

    if (!supplier) {

        alert(
            "❌ Supplier পাওয়া যায়নি।"
        );

        return;
    }

    const company =
        document.getElementById(
            "supplierCompany"
        );

    const name =
        document.getElementById(
            "supplierName"
        );

    const mobile =
        document.getElementById(
            "supplierMobile"
        );

    const email =
        document.getElementById(
            "supplierEmail"
        );

    const address =
        document.getElementById(
            "supplierAddress"
        );

    const due =
        document.getElementById(
            "supplierDue"
        );

    const note =
        document.getElementById(
            "supplierNote"
        );

    if (company) {

        company.value =
            supplier.company ??
            supplier.companyName ??
            "";

    }

    if (name) {

        name.value =
            supplier.name ??
            supplier.contactPerson ??
            supplier.supplierName ??
            "";

    }

    if (mobile) {

        mobile.value =
            supplier.mobile ??
            supplier.phone ??
            "";

    }

    if (email) {

        email.value =
            supplier.email || "";

    }

    if (address) {

        address.value =
            supplier.address || "";

    }

    if (due) {

        due.value =
            supplier.due || 0;

    }

    if (note) {

        note.value =
            supplier.note || "";

    }

    editIndex = index;

    // Scroll to form

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}

// ======================================
// Delete Supplier
// ======================================

function deleteSupplier(index) {

    const supplier =
        suppliers[index];

    if (!supplier) {

        alert(
            "❌ Supplier পাওয়া যায়নি।"
        );

        return;
    }

    const supplierName =
        supplier.company ||
        supplier.name ||
        "এই Supplier";

    if (
        !confirm(
            `আপনি কি "${supplierName}" Supplier-কে মুছে ফেলতে চান?`
        )
    ) {

        return;
    }

    suppliers.splice(
        index,
        1
    );

    // যদি edit করা Supplier মুছে ফেলা হয়

    if (editIndex === index) {

        editIndex = -1;

        if (supplierForm) {
            supplierForm.reset();
        }

        const due =
            document.getElementById(
                "supplierDue"
            );

        if (due) {
            due.value = 0;
        }

    } else if (editIndex > index) {

        editIndex--;

    }

    saveSuppliers();

    loadSuppliers();

    alert(
        "✅ Supplier মুছে ফেলা হয়েছে"
    );

}

// ======================================
// Live Search
// ======================================

if (searchSupplier) {

    searchSupplier.addEventListener(
        "input",
        function () {

            loadSuppliers(
                this.value
            );

        }
    );

}

// ======================================
// Reset Button
// ======================================

if (supplierForm) {

    supplierForm.addEventListener(
        "reset",
        function () {

            editIndex = -1;

            setTimeout(
                function () {

                    const due =
                        document.getElementById(
                            "supplierDue"
                        );

                    if (due) {
                        due.value = 0;
                    }

                },
                0
            );

        }
    );

}

// ======================================
// Logout
// ======================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function (e) {

            e.preventDefault();

            localStorage.removeItem(
                "isLoggedIn"
            );

            window.location.href =
                "login.html";

        }
    );

}

// ======================================
// Initialize
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSuppliers();

    }
);

// ======================================
// Make Functions Available Globally
// ======================================

window.editSupplier =
    editSupplier;

window.deleteSupplier =
    deleteSupplier;

window.loadSuppliers =
    loadSuppliers;

window.saveSuppliers =
    saveSuppliers;
