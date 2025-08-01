/**
 * name : kafka.js.
 * author : Mallanagouda R Biradar
 * created-date : 23-July-2025
 * Description : Kafka Configurations related information.
 */

//dependencies
const kafka = require('kafka-node')
const RESOURCE_DELETION_TOPIC = process.env.RESOURCE_DELETION_TOPIC

/**
 * Kafka configurations.
 * @function
 * @name connect
 */

const connect = function () {
	const Producer = kafka.Producer
	const KeyedMessage = kafka.KeyedMessage

	const client = new kafka.KafkaClient({
		kafkaHost: process.env.KAFKA_URL,
	})

	client.on('error', function (error) {
		console.log('kafka connection error!')
	})

	const producer = new Producer(client)

	producer.on('ready', function () {
		console.log('Connected to Kafka')
	})

	producer.on('error', function (err) {
		console.log('kafka producer creation error!')
	})

	// user Delete Consumer
	if (RESOURCE_DELETION_TOPIC !== 'OFF') {
		_sendToKafkaConsumers(RESOURCE_DELETION_TOPIC, process.env.KAFKA_URL)
	}

	return {
		kafkaProducer: producer,
		kafkaClient: client,
	}
}

/**
 * Send data based on topic to kafka consumers
 * @function
 * @name _sendToKafkaConsumers
 * @param {String} topic - name of kafka topic.
 * @param {String} host - kafka host
 */

var _sendToKafkaConsumers = function (topic, host) {
	if (topic && topic != '') {
		let consumer = new kafka.ConsumerGroup(
			{
				kafkaHost: host,
				groupId: process.env.KAFKA_GROUP_ID,
				autoCommit: true,
			},
			topic
		)

		consumer.on('message', async function (message) {
			console.log('-------Kafka consumer log starts here------------------')
			console.log('Topic Name: ', topic)
			console.log('Message: ', JSON.stringify(message))
			console.log('-------Kafka consumer log ends here------------------')
		})

		consumer.on('error', async function (error) {
			console.log('Kafka consumer error for topic:', RESOURCE_DELETION_TOPIC, error)
		})
	}
}

module.exports = connect
