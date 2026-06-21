import { createRouter, createWebHistory } from "vue-router";
import { useProfileStore } from "@/stores/userProfile";
import { waitUntil } from "@/utils/utils";

const OverviewView = (): Promise < any > =>
    import ('../views/taskManagement/OverviewView.vue')
const TaskListView = (): Promise < any > =>
    import ('../views/taskManagement/TaskListView.vue')
const TaskDetailView = (): Promise < any > =>
    import ('../views/taskManagement/taskDetailView.vue')
const AnnotationView = (): Promise < any > =>
    import ('../views/taskManagement/AnnotationView.vue')
    // createWebHistory
const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [{
            path: '/',
            redirect: '/tasks',
        }, {
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
            path: '/task/:id',
            name: 'taskDetail',
            component: TaskDetailView,
        },
        {
            path: '/annotation/:id',
            name: 'annotation',
            component: AnnotationView,
        },
        {
            path: '/401',
            name: '401',
            component: TaskListView,
        },
        {
            path: '/:pathMatch(.*)*',
            name: '404',
            redirect: '/tasks',
        },
    ],
})



const showChildrenRouter = (routerChildren: any[], menuChildren: any[]): void => {
    if (!routerChildren || !menuChildren) {
        return;
    }
    for (let menu of menuChildren) {
        if (!menu.isShow) {
            removeRouter(routerChildren, menu.value);
            continue;
        }
        addProperty(menu, routerChildren);
        if (!menu.children) {
            continue;
        }
        const currentRouter = routerChildren.find((item: any) => item.name === menu.value);
        if (!currentRouter || !currentRouter.children) {
            continue;
        }
        showChildrenRouter(currentRouter.children, menu.children);
    }
}

// 路由添加权限属性
const addProperty = (menu: any, routerChildren: { meta: { groupName ? : string;requiresAuth ? : boolean } }[]): void => {
    routerChildren.forEach(item => {
        if (item.meta && item.meta.groupName === menu.value) {
            item.meta.requiresAuth = menu.requiresAuth
        }
    })
}

const removeRouter = (routerChildren: { meta: { groupName: string } }[], value: string): void => {
    for (let i = routerChildren.length - 1; i >= 0; i--) {
        if (routerChildren[i].meta.groupName === value) {
            routerChildren.splice(i, 1); // 删除当前项
        }
    }
}

// 路由缓存不匹配时自动刷新页面
router.onError((error): void => {
    if (error.message.includes("Failed to fetch dynamically imported module")) {
        window.location.reload();
    }
});


router.beforeEach(async(to, from, next): Promise < void > => {
    if (to.name === '401' || to.name === '404') {
        return next();
    }
    const userStore = useProfileStore();
    const userInfo = userStore.userInfo;
    await waitUntil(() => userStore.getCheckLoginStatus());
    if (!userInfo.w3Id) {
        try {
            await userStore.initUserInfo()
        } catch (error) {
            console.error('初始化用户信息失败:', error)
            return next({ name: '401' });
        }
    }
    return next();
})
export default router;