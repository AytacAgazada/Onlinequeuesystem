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
const autoRefreshBtn1 = document.getElementById("autoRefreshBtn") // Birinci auto refresh düyməsi
const autoRefreshBtn2 = document.getElementById("autoRefreshBtn2") // İkinci auto refresh düyməsi

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

    // Auto Refresh düymələri üçün event listener-lar
    if (autoRefreshBtn1) {
        autoRefreshBtn1.addEventListener("click", toggleAutoRefresh)
    }
    if (autoRefreshBtn2) {
        autoRefreshBtn2.addEventListener("click", toggleAutoRefresh)
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const defaultOptions = {
        headers: {
            "Content-Type": "application/json",
        },
    }

    showLoading() // Her API çağırışında loading göstər
    try {
        const response = await fetch(url, { ...defaultOptions, ...options })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorText}`)
        }

        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
            return await response.json()
        } else {
            return await response.text()
        }
    } catch (error) {
        console.error("API call failed:", error)
        showToast("Xəta", `API çağırışında səhv: ${error.message}`, "error")
        throw error
    } finally {
        hideLoading() // API çağırışı bitdikdə loading gizlə
    }
}

// Load Initial Data
async function loadInitialData() {
    try {
        await loadQueues()
        updateDashboardStats()
    } catch (error) {
        // Hata toast'ı apiCall içinde gösterildiği için burada tekrar göstermiyoruz.
        // showToast("Xəta", "Məlumatlar yüklənə bilmədi", "error");
    }
}

// Queue Management
async function loadQueues() {
    try {
        allQueues = await apiCall("/list")
        filteredQueues = [...allQueues] // Bütün növbələri yüklədikdən sonra süzgəcdən keçirilənləri də yenilə
        updateDashboardStats()
        displayRecentQueues()
        displayQueues()
        // Filter dropdown-ı yeniləyici yükləmədən sonra tətbiq edin
        handleFilterChange(); // Filtri yenidən tətbiq et
    } catch (error) {
        allQueues = []
        filteredQueues = []
        updateDashboardStats()
        displayRecentQueues()
        displayQueues()
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
        await loadQueues() // Yeni növbə yaradıldıqdan sonra siyahını yenilə
    } catch (error) {
        // Hata toast'ı apiCall içinde gösterildiği için burada tekrar göstermiyoruz.
        // showToast("Xəta", "Növbə yaradıla bilmədi", "error");
    } finally {
        createBtn.disabled = false
        createBtn.innerHTML = originalText
    }
}

// ID ilə tamamlama
async function completeQueueById(id) {
    try {
        // showLoading(); // apiCall içinde zaten var
        await apiCall(`/${id}/complete`, { // Backend-dəki PUT endpoint-ə uyğun
            method: "PUT",
        })

        showToast("Uğurlu", `Növbə ${id} tamamlandı`, "success")
        await loadQueues() // Tamamlandıqdan sonra siyahını yenilə
    } catch (error) {
        // Hata toast'ı apiCall içinde gösterildiği için burada tekrar göstermiyoruz.
        // console.error("Complete queue error:", error);
        // showToast("Xəta", "Növbə tamamlana bilmədi", "error");
    } finally {
        // hideLoading(); // apiCall içinde zaten var
    }
}

// ID ilə silmə
async function deleteQueueById(id) {
    if (!confirm(`${id} nömrəli növbəni silmək istədiyinizə əminsiniz?`)) {
        return
    }

    try {
        // showLoading(); // apiCall içinde zaten var
        await apiCall(`/${id}`, { // Backend-dəki DELETE endpoint-ə uyğun
            method: "DELETE",
        })

        showToast("Uğurlu", `Növbə ${id} silindi`, "success")
        await loadQueues() // Silindikdən sonra siyahını yenilə
    } catch (error) {
        // Hata toast'ı apiCall içinde gösterildiği için burada tekrar göstermiyoruz.
        // console.error("Delete queue error:", error);
        // showToast("Xəta", "Növbə silinə bilmədi", "error");
    } finally {
        // hideLoading(); // apiCall içinde zaten var
    }
}

function handleFilterChange() {
    const selectedType = filterServiceType.value

    if (selectedType === "all") {
        filteredQueues = [...allQueues]
    } else {
        filteredQueues = allQueues.filter((queue) => queue.serviceType === selectedType)
    }

    displayQueues() // Filtri tətbiq etdikdən sonra növbələri yenidən göstər
}

// Auto Refresh Functionality
function toggleAutoRefresh() {
    // Both buttons should reflect the same state
    const setButtonState = (button, isEnabled) => {
        if (button) {
            if (isEnabled) {
                button.innerHTML = '<i class="fas fa-pause"></i> Auto Yenilə'
                button.classList.remove("btn-outline")
                button.classList.add("btn-success")
            } else {
                button.innerHTML = '<i class="fas fa-play"></i> Auto Yenilə'
                button.classList.remove("btn-success")
                button.classList.add("btn-outline")
            }
        }
    }

    if (autoRefreshEnabled) {
        // Stop auto refresh
        clearInterval(autoRefreshInterval)
        autoRefreshInterval = null; // Təmizlə
        autoRefreshEnabled = false

        setButtonState(autoRefreshBtn1, false)
        setButtonState(autoRefreshBtn2, false)

        showToast("Info", "Auto yeniləmə dayandırıldı", "info")
    } else {
        // Start auto refresh
        autoRefreshInterval = setInterval(() => {
            loadQueues()
        }, 5000) // 5 saniyədə bir yenilə

        autoRefreshEnabled = true

        setButtonState(autoRefreshBtn1, true)
        setButtonState(autoRefreshBtn2, true)

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
    // Son 5 tamamlanmamış növbəni göstər (və ya başqa bir məntiq tətbiq edə bilərsiniz)
    const recentQueues = allQueues
        .filter(q => !q.completed) // Yalnız gözləyənləri göstərmək üçün
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Ən yenidən köhnəyə sırala
        .slice(0, 5);

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
                            <button class="btn btn-success" onclick="completeQueueById(${queue.id})" title="Tamamla">
                                <i class="fas fa-check"></i>
                            </button>
                        `
                    : `
                            <button class="btn btn-success" disabled title="Artıq tamamlanıb">
                                <i class="fas fa-check-double"></i>
                            </button>
                        `
            }
                    <button class="btn btn-danger" onclick="deleteQueueById(${queue.id})" title="Sil">
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
    showToast("Məlumat", "Növbələr yeniləndi", "info");
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