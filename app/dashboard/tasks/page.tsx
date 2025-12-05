import { requireAuth } from "@/lib/auth";
import { useState } from "react"
import { usePMSStore, type Task } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, CheckCircle2, Circle, Clock, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { MainLayout } from "@/components/main-layout"

export default async function TasksPage() {
  await requireAuth();

  return (
    <MainLayout>
      <TasksPageClient />
    </MainLayout>
  )
}

function TasksPageClient() {
  const { tasks, units, addTask, updateTask, deleteTask } = usePMSStore()
  const [search, setSearch] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "cleaning" as Task["type"],
    unitId: "defaultUnitId", // Updated default value to be a non-empty string
    assignedTo: "",
    dueDate: "",
    priority: "medium" as Task["priority"],
  })

  const todoTasks = tasks.filter((t) => t.status === "todo")
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  const handleAddTask = () => {
    const unit = units.find((u) => u.id === formData.unitId)
    addTask({
      ...formData,
      unitNumber: unit?.number,
      status: "todo",
      createdAt: new Date().toISOString().split("T")[0],
    })
    setIsAddModalOpen(false)
    setFormData({
      title: "",
      description: "",
      type: "cleaning",
      unitId: "defaultUnitId", // Updated default value to be a non-empty string
      assignedTo: "",
      dueDate: "",
      priority: "medium",
    })
  }

  const moveTask = (taskId: string, newStatus: Task["status"]) => {
    updateTask(taskId, { status: newStatus })
  }

  const typeLabels = {
    cleaning: "تنظيف",
    maintenance: "صيانة",
    inspection: "فحص",
    other: "أخرى",
  }

  const priorityConfig = {
    low: { label: "منخفضة", color: "bg-secondary text-secondary-foreground" },
    medium: { label: "متوسطة", color: "bg-warning/20 text-warning" },
    high: { label: "عالية", color: "bg-destructive/20 text-destructive" },
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="mb-3 cursor-move hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm">{task.title}</h4>
              <Badge className={cn("text-xs", priorityConfig[task.priority].color)}>
                {priorityConfig[task.priority].label}
              </Badge>
            </div>
            {task.unitNumber && <p className="text-xs text-muted-foreground mt-1">وحدة {task.unitNumber}</p>}
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="text-xs">
                {typeLabels[task.type]}
              </Badge>
              <span className="text-xs text-muted-foreground">{task.dueDate}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{task.assignedTo}</p>
          </div>
        </div>
        <div className="flex gap-1 mt-3 pt-2 border-t border-border">
          {task.status !== "todo" && (
            <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => moveTask(task.id, "todo")}>
              <Circle className="w-3 h-3 ml-1" />
              للتنفيذ
            </Button>
          )}
          {task.status !== "in-progress" && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => moveTask(task.id, "in-progress")}
            >
              <Clock className="w-3 h-3 ml-1" />
              قيد التنفيذ
            </Button>
          )}
          {task.status !== "completed" && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => moveTask(task.id, "completed")}
            >
              <CheckCircle2 className="w-3 h-3 ml-1" />
              مكتمل
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTask(task.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المهام</h1>
          <p className="text-muted-foreground">إدارة مهام التنظيف والصيانة</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة مهمة
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث في المهام..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Todo Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Circle className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">للتنفيذ</h3>
            <Badge variant="secondary">{todoTasks.length}</Badge>
          </div>
          <div className="space-y-3 min-h-[200px] p-3 bg-secondary/30 rounded-xl">
            {todoTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">قيد التنفيذ</h3>
            <Badge variant="secondary">{inProgressTasks.length}</Badge>
          </div>
          <div className="space-y-3 min-h-[200px] p-3 bg-primary/10 rounded-xl">
            {inProgressTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="font-semibold">مكتمل</h3>
            <Badge variant="secondary">{completedTasks.length}</Badge>
          </div>
          <div className="space-y-3 min-h-[200px] p-3 bg-success/10 rounded-xl">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مهمة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>عنوان المهمة</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="تنظيف وحدة 103"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="تفاصيل المهمة..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Task["type"]) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">تنظيف</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="inspection">فحص</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Task["priority"]) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوحدة (اختياري)</Label>
              <Select value={formData.unitId} onValueChange={(value) => setFormData({ ...formData, unitId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defaultUnitId">بدون وحدة</SelectItem>{" "}
                  {/* Updated default value to be a non-empty string */}
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.number} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المكلف</Label>
                <Input
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="فريق التنظيف"
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddTask}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
