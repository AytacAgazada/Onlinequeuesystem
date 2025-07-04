// API Configuration
const API_BASE_URL = "http://localhost:8080/api/queues"

// Service Types Mapping
const SERVICE_TYPES = {
    URGENT_MONEY_TRANSFER: "Təcili Pul Köçürməsi",
    URGENT_MONEY_WITHDRAWAL: "Təcili Pul Çıxarılması",
    PLASTIC_CARD_VISA: "Plastik Kart (Visa)",
    PLASTIC_CARD_MASTER: "Plastik Kart (Master)",
    CREDIT_ONLINE: "Kredit (Online)",
    CREDIT_CASH: "Kredit (Nağd)",
    DEPOSIT_BOX: "Depozit Qutusu",
    DEPOSIT_WITHDRAWAL: "Depozit Çıxarılması",
}

// Global State
let allQueues = []
let filteredQueues = []

// Auto Refresh State
let autoRefreshInterval = null
let autoRefreshEnabled = false

// DOM Elements
const tabButtons = document.querySelectorAll(".tab-btn")
const tabContents = document.querySelectorAll(".tab-content")
const createQueueForm = document.getElementById("createQueueForm")
const filterServiceType = document.getElementById("filterServiceType")

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    initializeTabs()
    initializeEventListeners()
    loadInitialData()
})

// Tab Management
function initializeTabs() {
    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const tabId = button.getAttribute("data-tab")
            switchTab(tabId)
        })
    })
}

function switchTab(tabId) {
    tabButtons.forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`[data-tab="${tabId}"]`).classList.add("active")

    tabContents.forEach((content) => content.classList.remove("active"))
    document.getElementById(tabId).classList.add("active")

    if (tabId === "statistics") {
        loadStatistics()
    } else if (tabId === "queues") {
        displayQueues()
    }
}

// Event Listeners
function initializeEventListeners() {
    createQueueForm.addEventListener("submit", handleCreateQueue)
    filterServiceType.addEventListener("change", handleFilterChange)
}

// API Functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const defaultOptions = {
        headers: {
            "Content-Type": "application/json",
        },
    }

    try {
        const response = await fetch(url, { ...defaultOptions, ...options })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
            return await response.json()
        } else {
            return await response.text()
        }
    } catch (error) {
        console.error("API call failed:", error)
        throw error
    }
}

// Load Initial Data
async function loadInitialData() {
    showLoading()
    try {
        await loadQueues()
        updateDashboardStats()
    } catch (error) {
        showToast("Xəta", "Məlumatlar yüklənə bilmədi", "error")
    } finally {
        hideLoading()
    }
}

// Queue Management
async function loadQueues() {
    try {
        allQueues = await apiCall("/list")
        filteredQueues = [...allQueues]
        updateDashboardStats()
        displayRecentQueues()
        displayQueues()
    } catch (error) {
        showToast("Xəta", "Növbələr yüklənə bilmədi", "error")
        allQueues = []
        filteredQueues = []
    }
}

async function handleCreateQueue(event) {
    event.preventDefault()

    const serviceType = document.getElementById("serviceType").value
    const userFullName = document.getElementById("userFullName").value.trim()

    if (!serviceType || !userFullName) {
        showToast("Xəta", "Bütün sahələri doldurun", "error")
        return
    }

    if (userFullName.length < 2 || userFullName.length > 50) {
        showToast("Xəta", "Ad 2-50 simvol arasında olmalıdır", "error")
        return
    }

    const createBtn = document.getElementById("createBtn")
    const originalText = createBtn.innerHTML

    try {
        createBtn.disabled = true
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yaradılır...'

        const newQueue = await apiCall("/create", {
            method: "POST",
            body: JSON.stringify({
                serviceType: serviceType,
                userFullName: userFullName,
            }),
        })

        showToast("Uğurlu", `Növbə yaradıldı: ${newQueue.queueNumber}`, "success")
        createQueueForm.reset()
        await loadQueues()
    } catch (error) {
        showToast("Xəta", "Növbə yaradıla bilmədi", "error")
    } finally {
        createBtn.disabled = false
        createBtn.innerHTML = originalText
    }
}

// Queue number ilə tamamlama
async function completeQueue(queueNumber) {
    try {
        showLoading()

        const response = await apiCall(`/complete-by-number/${queueNumber}`, {
            method: "PUT",
        })

        showToast("Uğurlu", `Növbə ${queueNumber} tamamlandı`, "success")
        await loadQueues()
    } catch (error) {
        console.error("Complete queue error:", error)
        showToast("Xəta", "Növbə tamamlana bilmədi", "error")
    } finally {
        hideLoading()
    }
}

// Queue number ilə silmə
async function deleteQueue(queueNumber) {
    if (!confirm(`${queueNumber} nömrəli növbəni silmək istədiyinizə əminsiniz?`)) {
        return
    }

    try {
        showLoading()

        await apiCall(`/delete-by-number/${queueNumber}`, {
            method: "DELETE",
        })

        showToast("Uğurlu", `Növbə ${queueNumber} silindi`, "success")
        await loadQueues()
    } catch (error) {
        console.error("Delete queue error:", error)
        showToast("Xəta", "Növbə silinə bilmədi", "error")
    } finally {
        hideLoading()
    }
}

function handleFilterChange() {
    const selectedType = filterServiceType.value

    if (selectedType === "all") {
        filteredQueues = [...allQueues]
    } else {
        filteredQueues = allQueues.filter((queue) => queue.serviceType === selectedType)
    }

    displayQueues()
}

// Auto Refresh Functionality
function toggleAutoRefresh() {
    const button1 = document.getElementById("autoRefreshBtn")
    const button2 = document.getElementById("autoRefreshBtn2")

    if (autoRefreshEnabled) {
        // Stop auto refresh
        clearInterval(autoRefreshInterval)
        autoRefreshEnabled = false

        const stopHTML = '<i class="fas fa-play"></i> Auto Yenilə'
        if (button1) {
            button1.innerHTML = stopHTML
            button1.classList.remove("btn-success")
            button1.classList.add("btn-outline")
        }
        if (button2) {
            button2.innerHTML = stopHTML
            button2.classList.remove("btn-success")
            button2.classList.add("btn-outline")
        }

        showToast("Info", "Auto yeniləmə dayandırıldı", "info")
    } else {
        // Start auto refresh
        autoRefreshInterval = setInterval(() => {
            loadQueues()
        }, 5000) // 5 saniyədə bir yenilə

        autoRefreshEnabled = true

        const startHTML = '<i class="fas fa-pause"></i> Auto Yenilə'
        if (button1) {
            button1.innerHTML = startHTML
            button1.classList.remove("btn-outline")
            button1.classList.add("btn-success")
        }
        if (button2) {
            button2.innerHTML = startHTML
            button2.classList.remove("btn-outline")
            button2.classList.add("btn-success")
        }

        showToast("Success", "Auto yeniləmə başladı (5s)", "success")
    }
}

// Display Functions
function updateDashboardStats() {
    const totalQueues = allQueues.length
    const waitingQueues = allQueues.filter((q) => !q.completed).length
    const completedQueues = allQueues.filter((q) => q.completed).length

    document.getElementById("totalQueues").textContent = totalQueues
    document.getElementById("waitingQueues").textContent = waitingQueues
    document.getElementById("completedQueues").textContent = completedQueues
}

function displayRecentQueues() {
    const recentQueuesContainer = document.getElementById("recentQueues")
    const recentQueues = allQueues.slice(0, 5)

    if (recentQueues.length === 0) {
        recentQueuesContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>Hələ ki növbə yoxdur</p>
            </div>
        `
        return
    }

    recentQueuesContainer.innerHTML = recentQueues
        .map(
            (queue) => `
        <div class="queue-item">
            <div class="queue-info">
                <span class="badge badge-queue">${queue.queueNumber}</span>
                <div class="queue-details">
                    <h4>${queue.userFullName}</h4>
                    <p>${SERVICE_TYPES[queue.serviceType] || queue.serviceType}</p>
                </div>
            </div>
            <span class="badge ${queue.completed ? "badge-completed" : "badge-waiting"}">
                ${queue.completed ? "Tamamlandı" : "Gözləyir"}
            </span>
        </div>
    `,
        )
        .join("")
}

function displayQueues() {
    const tableBody = document.getElementById("queuesTableBody")
    const noQueues = document.getElementById("noQueues")

    if (filteredQueues.length === 0) {
        tableBody.innerHTML = ""
        noQueues.classList.remove("hidden")
        return
    }

    noQueues.classList.add("hidden")

    tableBody.innerHTML = filteredQueues
        .map(
            (queue) => `
        <tr>
            <td><span class="badge badge-queue">${queue.queueNumber}</span></td>
            <td>${queue.userFullName}</td>
            <td>${SERVICE_TYPES[queue.serviceType] || queue.serviceType}</td>
            <td>
                <span class="badge ${queue.completed ? "badge-completed" : "badge-waiting"}">
                    ${queue.completed ? "Tamamlandı" : "Gözləyir"}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    ${
                !queue.completed
                    ? `
                        <button class="btn btn-success" onclick="completeQueue('${queue.queueNumber}')" title="Tamamla">
                            <i class="fas fa-check"></i>
                        </button>
                    `
                    : `
                        <button class="btn btn-success" disabled title="Artıq tamamlanıb">
                            <i class="fas fa-check-double"></i>
                        </button>
                    `
            }
                    <button class="btn btn-danger" onclick="deleteQueue('${queue.queueNumber}')" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
        )
        .join("")
}

async function loadStatistics() {
    const statisticsContent = document.getElementById("statisticsContent")

    try {
        statisticsContent.innerHTML =
            '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Statistika yüklənir...</div>'

        const stats = await apiCall("/statistics")

        statisticsContent.innerHTML = `<pre>${stats}</pre>`
    } catch (error) {
        statisticsContent.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Statistika yüklənə bilmədi</p>
            </div>
        `
    }
}

// Utility Functions
function refreshQueues() {
    loadQueues()
}

function showLoading() {
    document.getElementById("loadingOverlay").classList.remove("hidden")
}

function hideLoading() {
    document.getElementById("loadingOverlay").classList.add("hidden")
}

function showToast(title, message, type = "info") {
    const toastContainer = document.getElementById("toastContainer")
    const toastId = "toast-" + Date.now()

    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.id = toastId
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-title">${title}</span>
            <button class="toast-close" onclick="removeToast('${toastId}')">&times;</button>
        </div>
        <div class="toast-message">${message}</div>
    `

    toastContainer.appendChild(toast)

    setTimeout(() => {
        removeToast(toastId)
    }, 5000)
}

function removeToast(toastId) {
    const toast = document.getElementById(toastId)
    if (toast) {
        toast.remove()
    }
}

// Error Handling
window.addEventListener("error", (event) => {
    console.error("Global error:", event.error)
    showToast("Xəta", "Gözlənilməz xəta baş verdi", "error")
})

window.addEventListener("online", () => {
    showToast("Bağlantı", "İnternet bağlantısı bərpa olundu", "success")
    loadInitialData()
})

window.addEventListener("offline", () => {
    showToast("Xəta", "İnternet bağlantısı kəsildi", "error")
})

// Clean up on page unload
window.addEventListener("beforeunload", () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
    }
})
