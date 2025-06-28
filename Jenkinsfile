@Library('Shared') _

pipeline {
    agent any

    environment {
        SONAR_HOME = tool "Sonar"
        AWS_REGION = 'us-east-1' // Public ECR works only in this region
        PUBLIC_ECR_REGISTRY = 'public.ecr.aws/e4p6x5z2'
        BACKEND_REPO = 'wanderlust-backend-beta'
        FRONTEND_REPO = 'wanderlust-frontend-beta'
    }

    parameters {
        string(name: 'FRONTEND_DOCKER_TAG', defaultValue: '', description: 'Frontend image tag')
        string(name: 'BACKEND_DOCKER_TAG', defaultValue: '', description: 'Backend image tag')
    }

    stages {
        stage("Validate Parameters") {
            steps {
                script {
                    if (!params.FRONTEND_DOCKER_TAG || !params.BACKEND_DOCKER_TAG) {
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

        stage('Git: Code Checkout') {
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

        stage("Environment Setup") {
            parallel {
                stage("Backend Env Setup") {
                    steps {
                        withCredentials([[
                            $class: 'AmazonWebServicesCredentialsBinding',
                            credentialsId: 'aws-cred'
                        ]]) {
                            dir("Automations") {
                                sh '''
                                    aws sts get-caller-identity
                                    bash updatebackendnew.sh
                                '''
                            }
                        }
                    }
                }

                stage("Frontend Env Setup") {
                    steps {
                        withCredentials([[
                            $class: 'AmazonWebServicesCredentialsBinding',
                            credentialsId: 'aws-cred'
                        ]]) {
                            dir("Automations") {
                                sh '''
                                    aws sts get-caller-identity
                                    bash updatefrontendnew.sh
                                '''
                            }
                        }
                    }
                }
            }
        }

        stage("Ensure Public ECR Repositories Exist") {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-cred'
                ]]) {
                    script {
                        sh """
                            # Ensure backend repo exists
                            aws ecr-public describe-repositories \
                              --region ${env.AWS_REGION} \
                              --repository-names ${env.BACKEND_REPO} || \
                            aws ecr-public create-repository \
                              --region ${env.AWS_REGION} \
                              --repository-name ${env.BACKEND_REPO}

                            # Ensure frontend repo exists
                            aws ecr-public describe-repositories \
                              --region ${env.AWS_REGION} \
                              --repository-names ${env.FRONTEND_REPO} || \
                            aws ecr-public create-repository \
                              --region ${env.AWS_REGION} \
                              --repository-name ${env.FRONTEND_REPO}
                        """
                    }
                }
            }
        }

        stage("Docker: Build Images") {
            steps {
                script {
                    dir('backend') {
                        sh """
                            docker build -t ${env.PUBLIC_ECR_REGISTRY}/${env.BACKEND_REPO}:${params.BACKEND_DOCKER_TAG} .
                        """
                    }

                    dir('frontend') {
                        sh """
                            docker build -t ${env.PUBLIC_ECR_REGISTRY}/${env.FRONTEND_REPO}:${params.FRONTEND_DOCKER_TAG} .
                        """
                    }
                }
            }
        }

        stage("Docker: Push to Public ECR") {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-cred'
                ]]) {
                    script {
                        sh """
                            aws ecr-public get-login-password --region ${env.AWS_REGION} | docker login --username AWS --password-stdin public.ecr.aws

                            docker push ${env.PUBLIC_ECR_REGISTRY}/${env.BACKEND_REPO}:${params.BACKEND_DOCKER_TAG}
                            docker push ${env.PUBLIC_ECR_REGISTRY}/${env.FRONTEND_REPO}:${params.FRONTEND_DOCKER_TAG}
                        """
                    }
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

