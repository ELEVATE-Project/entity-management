/**
 * name : producer.js.
 * author : Mallanagouda R Biradar
 * created-date : 23-July-2025
 * Description : Kafka Producer related information.
 */

const kafkaCommunicationsOnOff =
	!process.env.KAFKA_COMMUNICATIONS_ON_OFF || process.env.KAFKA_COMMUNICATIONS_ON_OFF != 'OFF' ? 'ON' : 'OFF'
const pushDeletedEntityTopic =
	process.env.RESOURCE_DELETION_TOPIC && process.env.RESOURCE_DELETION_TOPIC != 'OFF'
		? process.env.RESOURCE_DELETION_TOPIC
		: 'RESOURCE_DELETION_TOPIC'

/**
 * Push Entity Id to kafka.
 * @function
 * @name pushDeletedEntityToKafka
 * @param {Object} message - Message data.
 */

const pushDeletedEntityToKafka = function (message) {
	return new Promise(async (resolve, reject) => {
		try {
			let kafkaPushStatus = await pushMessageToKafka([
				{
					topic: pushDeletedEntityTopic,
					messages: JSON.stringify(message),
				},
			])

			return resolve(kafkaPushStatus)
		} catch (error) {
			return reject(error)
		}
	})
}

/**
 * Push message to kafka.
 * @function
 * @name pushMessageToKafka
 * @param {Object} payload - Payload data.
 */

const pushMessageToKafka = function (payload) {
	return new Promise((resolve, reject) => {
		if (kafkaCommunicationsOnOff != 'ON') {
			return reject(new Error('Kafka configuration is not done'))
		}

		console.log('-------Kafka producer log starts here------------------')
		console.log('Topic Name: ', payload[0].topic)
		console.log('Message: ', JSON.stringify(payload))
		console.log('-------Kafka producer log ends here------------------')

		kafkaClient.kafkaProducer.send(payload, (err, data) => {
			if (err) {
				return reject('Kafka push to topic ' + payload[0].topic + ' failed.')
			} else {
				return resolve(data)
			}
		})
	})
		.then((result) => {
			return {
				status: CONSTANTS.common.SUCCESS,
				message:
					'Kafka push to topic ' +
					payload[0].topic +
					' successful with number - ' +
					result[payload[0].topic][0],
			}
		})
		.catch((err) => {
			return {
				status: 'failed',
				message: err,
			}
		})
}

module.exports = {
	pushDeletedEntityToKafka: pushDeletedEntityToKafka,
}
