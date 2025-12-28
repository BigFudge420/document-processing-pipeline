import app from "./src/app"
import config from "./src/config"

app.listen(config.port, () => {
    console.log(`Server listening on ${config.port}`)
})