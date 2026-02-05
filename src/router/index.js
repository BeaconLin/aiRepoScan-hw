import { createRouter, createWebHistory } from 'vue-router'

const OverviewView = () =>
    import ('../views/taskManagement/OverviewView.vue')
const TaskListView = () =>
    import ('../views/taskManagement/TaskListView.vue')
const CreateTaskView = () =>
    import ('../views/taskManagement/CreateTaskView.vue')
const TaskDetailView = () =>
    import ('../views/taskManagement/TaskDetailView.vue')
const AnnotationView = () =>
    import ('../views/taskManagement/AnnotationView.vue')

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [{
            path: '/',
            redirect: '/overview',
        },
        {
            path: '/overview',
            name: 'overview',
            component: OverviewView,
        },
        {
            path: '/tasks',
            name: 'tasks',
            component: TaskListView,
        },
        {
            path: '/create',
            name: 'create',
            component: CreateTaskView,
        },
        {
            path: '/task/:id',
            name: 'taskDetail',
            component: TaskDetailView,
        },
        {
            path: '/annotation/:id',
            name: 'annotation',
            component: AnnotationView,
        },
    ],
})

export default router