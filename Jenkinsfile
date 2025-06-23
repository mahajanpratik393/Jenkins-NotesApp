@Library('Shared') _

pipeline {
    agent { label 'Node' }

    environment {
        SONAR_HOME = tool "Sonar"
        AWS_REGION = 'ap-south-1'
        ECR_REGISTRY = '420065944332.dkr.ecr.ap-south-1.amazonaws.com'
        BACKEND_REPO = 'wanderlust-backend-beta'
        FRONTEND_REPO = 'wanderlust-frontend-beta'
    }

    parameters {
        string(name: 'FRONTEND_DOCKER_TAG', defaultValue: '', description: 'Docker tag for frontend image')
        string(name: 'BACKEND_DOCKER_TAG', defaultValue: '', description: 'Docker tag for backend image')
    }

    stages {
        stage("Validate Parameters") {
            steps {
                script {
                    if (params.FRONTEND_DOCKER_TAG == '' || params.BACKEND_DOCKER_TAG == '') {
                        error("FRONTEND_DOCKER_TAG and BACKEND_DOCKER_TAG must be provided.")
                    }
                }
            }
        }

        stage("Workspace Cleanup") {
            steps {
                cleanWs()
            }
        }

        stage("Git: Code Checkout") {
            steps {
                script {
                    code_checkout("https://github.com/farhan24680/Wanderlust-Mega-Project.git", "ecr")
                }
            }
        }

        stage("Trivy: Filesystem Scan") {
            steps {
                script {
                    trivy_scan()
                }
            }
        }

        stage("OWASP: Dependency Check") {
            steps {
                script {
                    owasp_dependency()
                }
            }
        }

        stage("SonarQube: Code Analysis") {
            steps {
                script {
                    sonarqube_analysis("Sonar", "wanderlust", "wanderlust")
                }
            }
        }

        stage("SonarQube: Quality Gate") {
            steps {
                script {
                    sonarqube_code_quality()
                }
            }
        }

        stage("Exporting Environment Variables") {
            parallel {
                stage("Backend Env Setup") {
                    steps {
                        dir("Automations") {
                            sh "bash updatebackendnew.sh"
                        }
                    }
                }

                stage("Frontend Env Setup") {
                    steps {
                        dir("Automations") {
                            sh "bash updatefrontendnew.sh"
                        }
                    }
                }
            }
        }

        stage("ECR: Ensure Repositories Exist") {
            steps {
                script {
                    createEcrRepoIfNotExists(env.BACKEND_REPO, env.AWS_REGION)
                    createEcrRepoIfNotExists(env.FRONTEND_REPO, env.AWS_REGION)
                }
            }
        }

        stage("Docker: Build Images") {
            steps {
                script {
                    dir('backend') {
                        docker_build("${env.ECR_REGISTRY}/${env.BACKEND_REPO}", "${params.BACKEND_DOCKER_TAG}")
                    }
                    dir('frontend') {
                        docker_build("${env.ECR_REGISTRY}/${env.FRONTEND_REPO}", "${params.FRONTEND_DOCKER_TAG}")
                    }
                }
            }
        }

        stage("Docker: Push to ECR") {
            steps {
                script {
                    ecrLogin(env.AWS_REGION, env.ECR_REGISTRY)

                    docker_push("${env.ECR_REGISTRY}/${env.BACKEND_REPO}", "${params.BACKEND_DOCKER_TAG}")
                    docker_push("${env.ECR_REGISTRY}/${env.FRONTEND_REPO}", "${params.FRONTEND_DOCKER_TAG}")
                }
            }
        }
    }

    post {
        success {
            archiveArtifacts artifacts: '*.xml', followSymlinks: false
            build job: "Wanderlust-CD", parameters: [
                string(name: 'FRONTEND_DOCKER_TAG', value: "${params.FRONTEND_DOCKER_TAG}"),
                string(name: 'BACKEND_DOCKER_TAG', value: "${params.BACKEND_DOCKER_TAG}")
            ]
        }
    }
}
