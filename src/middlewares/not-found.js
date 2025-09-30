export default function (_, res) {
  res.status(404).json({
    error: true,
    message: 'Endpoint Not found'
  })
}
