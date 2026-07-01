pipeline {
    agent any

    environment {
        // Variaveis de e-mail: nao hardcoded, vem do Jenkins Credentials
        EMAIL_REMETENTE = credentials('email-remetente')
        EMAIL_DESTINO   = credentials('email-destino')
        EMAIL_SENHA     = credentials('email-senha')

        // Credenciais do Docker Hub
        DOCKER_HUB_CREDS = credentials('docker-hub-credentials')

        // Configuracoes do Docker Hub
        DOCKER_IMAGE = "${DOCKER_HUB_CREDS_USR}/s07-devops"
        DOCKER_TAG = "${BUILD_NUMBER}"
        NODE_APP_IMAGE = "s07-node-app"

        // Configuracoes do pipeline
        REPORT_DIR         = 'test-results'
        NODE_RESULTS_DIR   = 'node-results'
        BUILD_DIR          = 'build'
        EMAIL_HISTORY_FILE = '/shared/nginx-data/email-history.json'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Email Dependencies') {
            steps {
                script {
                    echo 'Instalando dependencias do script de e-mail...'
                    sh 'npm install --omit=dev'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo 'Building Docker images...'
                    sh """
                        docker build -f Dockerfile -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                        docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest
                        docker build -f app/Dockerfile -t ${NODE_APP_IMAGE}:${DOCKER_TAG} app
                    """
                }
            }
        }

        stage('Testes') {
            steps {
                script {
                    echo 'Executando os specs Cypress com o node-app como coletor de resultados...'
                    sh """
                        test_network="s07-tests-${BUILD_NUMBER}"
                        node_container="s07-node-app-${BUILD_NUMBER}"
                        cypress_container="s07-cypress-${BUILD_NUMBER}"

                        rm -rf ${REPORT_DIR} ${NODE_RESULTS_DIR}
                        mkdir -p ${REPORT_DIR} ${NODE_RESULTS_DIR}

                        cleanup() {
                            docker cp "\$cypress_container:/e2e/${REPORT_DIR}/." "${REPORT_DIR}/" >/dev/null 2>&1 || true
                            docker cp "\$node_container:/data/." "${NODE_RESULTS_DIR}/" >/dev/null 2>&1 || true
                            
                            echo "=== RELATÓRIO DE COBERTURA DE TESTES ==="
                            docker exec "\$node_container" sh -c "cd /app && ./node_modules/.bin/nyc report --reporter=text --reporter=html" || true
                            echo "========================================="
                            
                            docker cp "\$node_container:/coverage/." "coverage/" >/dev/null 2>&1 || true
                            
                            docker rm -f "\$cypress_container" >/dev/null 2>&1 || true
                            docker rm -f "\$node_container" >/dev/null 2>&1 || true
                            docker network rm "\$test_network" >/dev/null 2>&1 || true
                        }

                        trap cleanup EXIT

                        docker rm -f "\$cypress_container" >/dev/null 2>&1 || true
                        docker rm -f "\$node_container" >/dev/null 2>&1 || true
                        docker network rm "\$test_network" >/dev/null 2>&1 || true
                        docker network create "\$test_network" >/dev/null

                        docker run -d \
                            --name "\$node_container" \
                            --network "\$test_network" \
                            --network-alias node-app \
                            ${NODE_APP_IMAGE}:${DOCKER_TAG} >/dev/null

                        for attempt in \$(seq 1 20); do
                            if docker exec "\$node_container" node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"; then
                                break
                            fi

                            if [ "\$attempt" -eq 20 ]; then
                                echo 'Node app nao respondeu ao healthcheck a tempo.'
                                docker logs "\$node_container" || true
                                exit 1
                            fi

                            sleep 2
                        done

                        docker create --name "\$cypress_container" \
                            --network "\$test_network" \
                            -e NODE_APP_URL="http://node-app:3000" \
                            ${DOCKER_IMAGE}:${DOCKER_TAG} \
                            --spec "cypress/e2e/**/*.cy.js" --browser electron --reporter junit --reporter-options "mochaFile=/e2e/${REPORT_DIR}/cypress-results-[hash].xml" >/dev/null

                        test_exit_code=0
                        docker start -a "\$cypress_container" || test_exit_code=\$?

                        exit "\$test_exit_code"
                    """
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: "${REPORT_DIR}/**/*.xml"
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    echo 'Empacotando aplicacao...'
                    sh "mkdir -p ${BUILD_DIR}"
                    sh """
                        tar -czvf ${BUILD_DIR}/app-build-\$(date +%Y%m%d-%H%M%S).tar.gz \
                            --exclude='./.git' \
                            --exclude='./node_modules' \
                            --exclude='./testes/node_modules' \
                            --exclude='./app/node_modules' \
                            --exclude='./${BUILD_DIR}' \
                            --exclude='./${REPORT_DIR}' \
                            --exclude='./${NODE_RESULTS_DIR}' \
                            .
                    """
                }
            }
        }

        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo 'Pushing image to Docker Hub...'
                    sh """
                        echo "${DOCKER_HUB_CREDS_PSW}" | docker login -u "${DOCKER_HUB_CREDS_USR}" --password-stdin
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                        docker logout
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finalizado!'
            script {
                echo 'Enviando notificacao por e-mail...'
                sh '''
                    if [ ! -d node_modules/nodemailer ]; then
                        npm install --omit=dev
                    fi
                '''
                def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'
                def buildUrl = env.BUILD_URL ?: ''
                sh 'mkdir -p /shared/nginx-data'
                def emailExitCode = withEnv([
                    "BUILD_STATUS=${buildStatus}",
                    "BUILD_URL=${buildUrl}",
                    "EMAIL_HISTORY_FILE=${EMAIL_HISTORY_FILE}"
                ]) {
                    sh(
                        script: '''
                            node script-email.js
                        ''',
                        returnStatus: true
                    )
                }

                if (emailExitCode != 0) {
                    echo 'Aviso: falha ao enviar a notificacao por e-mail. A pipeline seguira com o resultado principal da build.'
                }
            }
            archiveArtifacts artifacts: '**/build/*.tar.gz',            allowEmptyArchive: true
            archiveArtifacts artifacts: "${REPORT_DIR}/**/*.xml",       allowEmptyArchive: true
            archiveArtifacts artifacts: "${NODE_RESULTS_DIR}/**/*.json", allowEmptyArchive: true
            archiveArtifacts artifacts: 'coverage/**',  allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo 'Pipeline completado com SUCESSO!'
        }
        failure {
            echo 'Pipeline FALHOU! Verifique os logs.'
        }
    }
}
