const Modal = {
    open() {
        document
            .querySelector('.modal-overlay')
            .classList
            .add('active')

        document
            .getElementById("date").valueAsDate = new Date();
    },
    close() {
        document
            .querySelector('.modal-overlay')
            .classList
            .remove('active')
    }
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
    },
    set(transaction) {
        localStorage.setItem("dev.finances:transactions",
            JSON.stringify(transaction))
    },
    setTest(transaction) {
        localStorage.setItem("dev.finances:transactions_test",
            JSON.stringify(transaction))
    }
}


const Loader = {
    // função que busca e lê arquivo json
    load() {
        const file = document.getElementById("file").files[0];
        const fileReader = new FileReader();

        fileReader.onload = (fileLoaded) => {
            const dataFileLoaded = fileLoaded.target.result;            
            Storage.set(JSON.parse(dataFileLoaded))   
        };

        fileReader.readAsText(file, "UTF-8");
        App.init()
        document.location.reload(true);
    }
}

const Transaction = {
    all: Storage.get(),

    add(transaction) {
        Transaction.all.push(transaction)

        App.reload()
    },
    remove(index) {
        Transaction.all.splice(index, 1)

        App.reload()
    },

    incomes() {
        let income = 0
        Transaction.all.forEach(transaction => {
            if (transaction.amount > 0) {
                income += transaction.amount
            }
        })
        return income
    },

    expenses() {
        let expense = 0
        Transaction.all.forEach(transaction => {
            if (transaction.amount < 0) {
                expense += transaction.amount
            }
        })
        return expense
    },

    total() {
        // entradas - saídas
        return Transaction.incomes() + Transaction.expenses()
    }
}


const Download = {

    downloadContainer: document.querySelector('#download'),

    start() {
        const contentType = 'application/octet-stream';
        const content = Transaction.all.map((transaction) => {
            const html = `{"description":"${transaction.description}", "amount":${transaction.amount}, "date":"${transaction.date}"}`
            return html
        })

        const dataContent = `[${content}]`

        const blob = new Blob([dataContent], { 'type': contentType });
        const objToday = new Date();
        const yearMonthDay = objToday.toJSON().slice(0, 10).replace(/-/g, '');
        const curHour = objToday.getHours() > 12 ? objToday.getHours() : (objToday.getHours() < 10 ? "0" + objToday.getHours() : objToday.getHours())
        const curMinute = objToday.getMinutes() < 10 ? "0" + objToday.getMinutes() : objToday.getMinutes()
        const curSeconds = objToday.getSeconds() < 10 ? "0" + objToday.getSeconds() : objToday.getSeconds()
        const curMeridiem = objToday.getHours() > 12 ? "PM" : "AM";
        const filename = `storage-${yearMonthDay}${curHour}${curMinute}${curSeconds}${curMeridiem}.json`

        Download.downloadContainer.href = URL.createObjectURL(blob);
        Download.downloadContainer.download = filename;
    }
}


const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index

        DOM.transactionsContainer.appendChild(tr)

    },
    innerHTMLTransaction(transaction, index) {
        // calculo ternário
        const CSSclass = transaction.amount > 0 ? "income" : "expense"

        const amount = Utils.formatCurrency(transaction.amount)

        const html = `    
      <td class="description">${transaction.description}</td>
      <td class=${CSSclass}>${amount}</td>
      <td class="date">${transaction.date}</td>
      <td>
        <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
      </td>    
    `

        return html
    },
    updateBalance(transaction) {
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes())
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses())
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total())
    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ""
    }
}

const Utils = {
    formatAmount(value) {
        // formato simples
        //value = Number(value) * 100
        // com expressão regula REGEX porem já vem Number do input[]
        // value = Number(value.replace(/\,?\.?/g, "")) * 100
        value = value * 100
        return Math.round(value)
    },

    formatDate(date) {
        const splittedDate = date.split("-")

        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    },

    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : ""

        // separa tudo q é diferente de numero e substitui por vazio
        value = String(value).replace(/\D/g, "")

        value = Number(value) / 100

        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })

        return signal + value
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        }
    },

    validateField() {
        const { description, amount, date } = Form.getValues()
        if (description.trim() === "" ||
            amount.trim() === "" ||
            date.trim() === "") {
            throw new Error("Por favor, preencha todos os campos")
        }
    },

    formatValues() {
        let { description, amount, date } = Form.getValues()
        amount = Utils.formatAmount(amount)
        date = Utils.formatDate(date)

        return {
            description,
            amount,
            date
        }
    },

    clearFields() {
        Form.description.value = ""
        Form.amount.value = ""
        Form.date.value = ""
    },

    submit(event) {
        event.preventDefault()

        try {
            Form.validateField()
            const transaction = Form.formatValues()
            Transaction.add(transaction)
            Form.clearFields()
            Modal.close()

        } catch (error) {
            alert(error.message)
        }
    },
}


const App = {
    init() {
        Transaction.all.forEach(DOM.addTransaction)
        DOM.updateBalance()
        Storage.set(Transaction.all)
        Download.start()
    },
    reload() {
        DOM.clearTransactions()
        App.init()
    }
}

App.init()

