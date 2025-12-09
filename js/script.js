// Palkkiolaskurin konfiguraatio, vaihda tähän arvoja tarpeen mukaan (TÄHÄN VOI MUUTTAA ESIM ALV, VUOSITTAISET ARKIPYHÄT TAI TYÖVIIKON PITUUS)
const CONFIG = {
    STANDARD_DAILY_HOURS: 7.5,
    WORK_DAYS_PER_WEEK: 5,
    WEEKS_PER_YEAR: 52,
    PUBLIC_HOLIDAYS_HOURS: 60,
    ALV: 0.255,
};

const ANNUAL_WORK_HOURS = (CONFIG.STANDARD_DAILY_HOURS * CONFIG.WORK_DAYS_PER_WEEK * CONFIG.WEEKS_PER_YEAR) - CONFIG.PUBLIC_HOLIDAYS_HOURS;

// Apufunktio vastauksen muotoiluun valuutaksi
function formatCurrency(value) {
    try {
        const formatted = new Intl.NumberFormat('fi-FI', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
        return formatted;
    } catch (e) {
        console.error('Virhe formatCurrency:', e, 'arvo:', value);
        return value.toFixed(2) + ' €';
    }
}

// Apufunktio - hae numerot dropdownista 
function extractNumber(dropdownValue) {
    const match = dropdownValue.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Pääfunktio - laske tavoitelaskutus 
function calculateBilling(event) {
    if (event) {
        event.preventDefault();
    }
    
    try {
        // Hae syötteet lomakkeelta
        const targetMonthlyIncome = parseFloat(document.getElementById('verotettava-ansio').value) || 0;
        
        // Kuukausittaiset kulut 
        const monthlyExpenses = 
            (parseFloat(document.getElementById('tyotila-vuokra').value) || 0) +
            (parseFloat(document.getElementById('tyotila-muut').value) || 0) +
            (parseFloat(document.getElementById('puhelin').value) || 0) +
            (parseFloat(document.getElementById('netti').value) || 0) +
            (parseFloat(document.getElementById('muut-netit').value) || 0) +
            (parseFloat(document.getElementById('toimisto').value) || 0) +
            (parseFloat(document.getElementById('materiaalit').value) || 0) +
            (parseFloat(document.getElementById('auto').value) || 0) +
            (parseFloat(document.getElementById('ammattimaksut').value) || 0) +
            (parseFloat(document.getElementById('lehdet').value) || 0) +
            (parseFloat(document.getElementById('tyomatka').value) || 0) +
            (parseFloat(document.getElementById('varsinaiset-matkat').value) || 0) +
            (parseFloat(document.getElementById('rahoitus').value) || 0) +
            (parseFloat(document.getElementById('muut-kulut').value) || 0);
        
        // Vuosittaiset kulut 
        const annualExpenses = 
            (parseFloat(document.getElementById('tietokoneet').value) || 0) +
            (parseFloat(document.getElementById('kamera').value) || 0) +
            (parseFloat(document.getElementById('valaisin').value) || 0) +
            (parseFloat(document.getElementById('ohjelmistot').value) || 0) +
            (parseFloat(document.getElementById('vakuutukset-laitteet').value) || 0) +
            (parseFloat(document.getElementById('muut-vakuutukset').value) || 0) +
            (parseFloat(document.getElementById('yel').value) || 0) +
            (parseFloat(document.getElementById('kirjanpito').value) || 0) +
            (parseFloat(document.getElementById('tyoterveys').value) || 0) +
            (parseFloat(document.getElementById('koulutus').value) || 0) +
            (parseFloat(document.getElementById('markkinointi').value) || 0) +
            (parseFloat(document.getElementById('kotisivut').value) || 0) +
            (parseFloat(document.getElementById('muut-ostopalvelut').value) || 0);
        
        // Työmäärä 
        const hoursPerDay = extractNumber(document.getElementById('laskutettavat-tunnit').value);
        const vacationWeeks = extractNumber(document.getElementById('lomat').value);
        const sickDays = extractNumber(document.getElementById('sairauspaivat-vuosi').value);
        
        // Laskelmat 
        const totalAnnualExpenses = (monthlyExpenses * 12) + annualExpenses;
        const targetAnnualIncome = targetMonthlyIncome * 12;
        const requiredNetRevenue = targetAnnualIncome + totalAnnualExpenses;
        
        const vacationHours = vacationWeeks * CONFIG.STANDARD_DAILY_HOURS * CONFIG.WORK_DAYS_PER_WEEK;
        const sickHours = sickDays * CONFIG.STANDARD_DAILY_HOURS;
        const adjustedAnnualHours = ANNUAL_WORK_HOURS * (hoursPerDay / CONFIG.STANDARD_DAILY_HOURS);
        const billableAnnualHours = adjustedAnnualHours - vacationHours - sickHours;
        
        // Tavoiteansiot tunnilta, päivältä, viikolta, kuukaudelta ja vuodelta 
        const hourlyRate = requiredNetRevenue / billableAnnualHours;
        const hourlyRateWithVat = hourlyRate * (1 + CONFIG.ALV);
        
        const dailyRate = hourlyRate * CONFIG.STANDARD_DAILY_HOURS;
        const dailyRateWithVat = hourlyRateWithVat * CONFIG.STANDARD_DAILY_HOURS;
        
        const weeklyRate = dailyRate * CONFIG.WORK_DAYS_PER_WEEK;
        const weeklyRateWithVat = dailyRateWithVat * CONFIG.WORK_DAYS_PER_WEEK;
        
        const monthlyRate = hourlyRate * (billableAnnualHours / 12);
        const monthlyRateWithVat = monthlyRate * (1 + CONFIG.ALV);
        
        const annualRate = requiredNetRevenue;
        const annualRateWithVat = requiredNetRevenue * (1 + CONFIG.ALV);
        
        // Näytä tulokset 
        displayResults({
            totalAnnualExpenses,
            monthlyExpenses,
            annualExpenses,
            targetAnnualIncome,
            requiredNetRevenue,
            billableAnnualHours,
            hourlyRate,
            hourlyRateWithVat,
            dailyRate,
            dailyRateWithVat,
            weeklyRate,
            weeklyRateWithVat,
            monthlyRate,
            monthlyRateWithVat,
            annualRate,
            annualRateWithVat
        });
        
        // Tallenna lomakkeen tiedot 
        saveFormData();
        
    } catch (error) {
        console.error('Virhe laskennassa:', error);
        console.error('Stack:', error.stack);
        alert('Virhe laskennassa: ' + error.message);
    }
}

// Näytä tulokset taulukon ja mapin avulla
function displayResults(data) {
    const container = document.getElementById('tavoitelaskutus-tulos');
    container.style.display = 'block';
    if (!container) {
        console.error('tavoitelaskutus-tulos elementtiä ei löydy!');
        return;
    }
    
    const alvPercent = (CONFIG.ALV * 100).toFixed(1);
    
    // Taulukko summaarisen tiedon osioille
    const summaryItems = [
        {
            title: 'Vuosikulut yhteensä',
            value: data.totalAnnualExpenses,
            details: [
                { label: 'Kuukausittaiset kulut (vuodessa)', value: data.monthlyExpenses * 12 },
                { label: 'Vuosittaiset kulut', value: data.annualExpenses }
            ]
        },
        {
            title: 'Tavoitevuositulo (netto)',
            value: data.targetAnnualIncome
        },
        {
            title: 'Vaadittu nettotulo (kulut + tavoitetulo)',
            value: data.requiredNetRevenue
        },
        {
            title: 'Laskutettavat tunnit vuodessa',
            value: Math.round(data.billableAnnualHours),
            isHours: true
        }
    ];
    
    // Taulukko laskutuksien osioille (tunti, päivä, viikko, kk, vuosi)
    const billingRates = [
        {
            title: 'Tavoitelaskutus - Tunti',
            unit: '/ h',
            noVat: data.hourlyRate,
            withVat: data.hourlyRateWithVat
        },
        {
            title: 'Tavoitelaskutus - Päivä',
            unit: '/ pv',
            noVat: data.dailyRate,
            withVat: data.dailyRateWithVat
        },
        {
            title: 'Tavoitelaskutus - Viikko',
            unit: '/ vk',
            noVat: data.weeklyRate,
            withVat: data.weeklyRateWithVat
        },
        {
            title: 'Tavoitelaskutus - Kuukausi',
            unit: '/ kk',
            noVat: data.monthlyRate,
            withVat: data.monthlyRateWithVat
        },
        {
            title: 'Tavoitelaskutus - Vuosi',
            unit: '/ vuosi',
            noVat: data.annualRate,
            withVat: data.annualRateWithVat
        }
    ];
    
    // Rakenna HTML map-funktion avulla
    let html = '<div class="results">';
    html += '<h3>Laskutustulos</h3>';
    
    // Summariset osiot
    html += summaryItems.map(item => {
        let itemHtml = '<div class="result-section">';
        itemHtml += '<h4>' + item.title + '</h4>';
        itemHtml += '<p><strong>';
        itemHtml += item.isHours ? item.value + ' tuntia' : formatCurrency(item.value);
        itemHtml += '</strong></p>';
        
        if (item.details) {
            itemHtml += '<ul>';
            itemHtml += item.details.map(detail => 
                '<li>' + detail.label + ': ' + formatCurrency(detail.value) + '</li>'
            ).join('');
            itemHtml += '</ul>';
        }
        
        itemHtml += '</div>';
        return itemHtml;
    }).join('');
    
    html += '<hr>';
    
    // Laskutushinnat
    html += billingRates.map(rate => {
        return '<div class="result-section highlight">' +
                '<h4>' + rate.title + '</h4>' +
                '<p>Ilman ALV: <strong>' + formatCurrency(rate.noVat) + ' ' + rate.unit + '</strong></p>' +
                '<p>ALV ' + alvPercent + '% sisällyttäen: <strong>' + formatCurrency(rate.withVat) + ' ' + rate.unit + '</strong></p>' +
                '</div>';
    }).join('');
    
    html += '</div>';
    
    try {
        container.innerHTML = html;
    } catch (e) {
        console.error('Virhe innerHTML kirjoituksessa:', e);
    }
}

// Tallenna lomakkeen tiedot selaimeen 
function saveFormData() {
    const form = document.querySelector('form');
    if (!form) return;
    
    const formData = {};
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        if (input.id) {
            formData[input.id] = input.value;
        }
    });
    
    localStorage.setItem('billingCalculatorData', JSON.stringify(formData));
}

// Lataa tallennetut tiedot selaimesta 
function loadFormData() {
    const saved = localStorage.getItem('billingCalculatorData');
    if (!saved) return;
    
    const formData = JSON.parse(saved);
    
    Object.keys(formData).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = formData[id];
        }
    });
}

// Alusta kun sivu latautuu 
document.addEventListener('DOMContentLoaded', function() {
    loadFormData();
    
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', calculateBilling);
    }
});
