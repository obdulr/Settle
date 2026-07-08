import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  /**
   * Conversational debt assessment chatbot.
   * Body: { messages: ChatMessage[], currentData: AssessmentData }
   * Returns: { reply, extractedData, isComplete }
   */
  @Post('chat')
  async chat(@Body() body: { messages: any[]; currentData: any }) {
    return this.aiService.conductAssessmentChat(body.messages || [], body.currentData || {});
  }

  /**
   * Generate a personalized recommendation summary.
   * Body: { assessmentData, matchedProviders }
   */
  @Post('recommendation')
  async recommendation(@Body() body: { assessmentData: any; matchedProviders: any[] }) {
    const summary = await this.aiService.generateRecommendationSummary(
      body.assessmentData || {},
      body.matchedProviders || [],
    );
    return { summary };
  }
}
