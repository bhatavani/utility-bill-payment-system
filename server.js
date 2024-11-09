const express = require('express');
const app = express();
const port = 3000;
const Queue = require('./queues');
const PriorityQueue = require('./priorityQueue');
const Stack = require('./stacks');
const fileHandler = require('./fileHandler');

app.use(express.json());

const paymentQueue = new Queue();
const priorityQueue = new PriorityQueue();
const transactionStack = new Stack();

// Endpoint to create a payment request
app.post('/pay', async (req, res) => {
    const paymentDetails = req.body;
    await paymentQueue.enqueue(paymentDetails); // Async enqueue
    res.status(201).send({ message: 'Payment request added to queue.' });
});

// Endpoint to create a priority request (e.g., overdue payment)
app.post('/pay/urgent', async (req, res) => {
    const paymentDetails = req.body;
    await priorityQueue.enqueue(paymentDetails, paymentDetails.priority); // Async enqueue
    res.status(201).send({ message: 'Urgent payment request added to priority queue.' });
});

// Endpoint to process payment requests
app.post('/process', async (req, res) => {
    let processedPayment;
    if (!priorityQueue.isEmpty()) {
        processedPayment = await priorityQueue.dequeue();
    } else if (!paymentQueue.isEmpty()) {
        processedPayment = await paymentQueue.dequeue();
    } else {
        return res.status(404).send({ message: 'No payments to process.' });
    }

    await transactionStack.push(processedPayment); // Store in stack for undo capability
    await fileHandler.generateInvoice(processedPayment);
    await fileHandler.logTransaction(processedPayment);
    res.send({ message: processedPayment.priority ? 'Urgent payment processed.' : 'Payment processed.', payment: processedPayment });
});

// Endpoint to undo last processed payment
app.post('/undo', async (req, res) => {
    const lastTransaction = await transactionStack.pop(); // Undo functionality
    if (!lastTransaction) {
        return res.status(404).send({ message: 'No transactions to undo.' });
    }
    res.send({ message: 'Last transaction undone.', transaction: lastTransaction });
});

// Endpoint to view transaction history
app.get('/history', async (req, res) => {
    const history = await transactionStack.viewStack();
    res.send(history);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
